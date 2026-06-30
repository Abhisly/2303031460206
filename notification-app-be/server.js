import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure Database Connection Pool
const pgConfig = {
  host: process.env.PGHOST || "localhost",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  port: parseInt(process.env.PGPORT || "5432", 10),
};

const targetDatabase = process.env.PGDATABASE || "campus_notifications";
let pool = null;

// Database DDL definition
const DDL_STATEMENTS = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'recruiter')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('placement', 'result', 'event')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_read_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT uq_user_notification UNIQUE (user_id, notification_id)
);

CREATE TABLE IF NOT EXISTS evaluation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_read_statuses_unread_active 
ON notification_read_statuses(user_id) 
WHERE is_read = FALSE AND is_deleted = FALSE;
`;

const DEFAULT_STUDENT_ID = "c93a8d16-6548-4a58-8547-2384a8ab9610";

async function ensureDatabaseExists() {
  // Connect to default 'postgres' database first to check/create target database
  const adminClient = new pg.Client({ ...pgConfig, database: "postgres" });
  try {
    await adminClient.connect();
    const res = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDatabase]
    );
    if (res.rows.length === 0) {
      console.log(`Database "${targetDatabase}" does not exist. Creating it now...`);
      // CREATE DATABASE cannot run inside a transaction block, run it directly
      await adminClient.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`Database "${targetDatabase}" created successfully.`);
    }
  } catch (error) {
    console.error("Warning: Failed to ensure database exists via admin connection:", error.message);
  } finally {
    await adminClient.end().catch(() => {});
  }
}

async function initializeDatabase() {
  await ensureDatabaseExists();

  // Connect to target database
  pool = new pg.Pool({
    ...pgConfig,
    database: targetDatabase,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log(`Initializing tables and indexes in "${targetDatabase}"...`);
    await pool.query(DDL_STATEMENTS);
    console.log("Database schema tables and indexes verified successfully.");

    // Seed default student user
    const userRes = await pool.query("SELECT id FROM users WHERE id = $1", [DEFAULT_STUDENT_ID]);
    if (userRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
        [DEFAULT_STUDENT_ID, "student@campus.edu", "$2a$10$xyz", "student"]
      );
      console.log(`Default student user seeded: ${DEFAULT_STUDENT_ID}`);
    }

    // Seed mock notifications if empty
    const notifRes = await pool.query("SELECT COUNT(*) FROM notifications");
    if (parseInt(notifRes.rows[0].count, 10) === 0) {
      console.log("Seeding initial notifications...");
      
      const seedNotifications = [
        {
          type: "placement",
          title: "Google - Software Engineer FTE Hiring",
          message: "Google has opened applications for Software Engineer roles. Eligible branches: CSE, ISE, ECE. Package: 32 LPA. Deadline to apply is tonight.",
          payload: { salary_package: "32 LPA", eligible_branches: "CSE, ISE, ECE", deadline: "Tonight" }
        },
        {
          type: "result",
          title: "Microsoft Recruitments - Final Selects",
          message: "The final list of selected students for Microsoft FTE roles has been released. 12 students selected. Click to view results.",
          payload: { selected_count: "12", company: "Microsoft" }
        },
        {
          type: "event",
          title: "Annual Tech Fest - Hackathon 2026",
          message: "Register for the 24-hour campus hackathon. Cash prizes up to 1.5 Lakhs. Food and merchandise will be provided.",
          payload: { venue: "Main Auditorium", duration: "24 Hours", prize_pool: "1.5 Lakhs" }
        },
        {
          type: "placement",
          title: "Uber - Internship Drive for 3rd Year",
          message: "Uber is hiring Summer Interns. CGPA criteria: 8.5+. Test schedule will be shared soon.",
          payload: { stipend: "1.2 LPM", cgpa_cutoff: "8.5" }
        },
        {
          type: "result",
          title: "Amazon Selects - SDE Internships",
          message: "Amazon has published results for the online assessment. 45 students shortlisted for interviews.",
          payload: { shortlisted_students: "45", role: "SDE Intern" }
        },
        {
          type: "event",
          title: "Resume Building Seminar by Industry Experts",
          message: "Join us in the seminar hall for an interactive workshop on crafting a standout resume for product companies.",
          payload: { speaker: "Siddharth (Staff Eng, Netflix)", venue: "Seminar Hall 2" }
        },
        {
          type: "placement",
          title: "Adobe Systems - Product Intern Selection",
          message: "Adobe online challenge starts tomorrow at 10 AM on HackerRank. Logins will be shared via registered mail.",
          payload: { portal: "HackerRank", test_duration: "120 mins" }
        },
        {
          type: "result",
          title: "Goldman Sachs - OA Shortlist",
          message: "Results of Goldman Sachs Online Assessment are out. 30 students are moving to interview rounds.",
          payload: { company: "Goldman Sachs", candidates_count: "30" }
        },
        {
          type: "event",
          title: "Expert Talk on Generative AI and LLMs",
          message: "Professor Radhakrishnan will present recent trends in model optimization and training techniques.",
          payload: { speaker: "Dr. Radhakrishnan", time: "2:00 PM" }
        },
        {
          type: "placement",
          title: "J.P. Morgan - Software Engineer Program",
          message: "J.P. Morgan Chase & Co. applications are open. CGPA: 7.0+ eligible.",
          payload: { role: "Software Engineer", compensation: "19.7 LPA" }
        }
      ];

      for (const n of seedNotifications) {
        const notifVal = await pool.query(
          "INSERT INTO notifications (type, title, message, payload) VALUES ($1, $2, $3, $4) RETURNING id",
          [n.type, n.title, n.message, JSON.stringify(n.payload)]
        );
        const newNotifId = notifVal.rows[0].id;

        await pool.query(
          "INSERT INTO notification_read_statuses (notification_id, user_id, is_read) VALUES ($1, $2, $3)",
          [newNotifId, DEFAULT_STUDENT_ID, false]
        );
      }
      console.log("Mock notifications database seeded successfully.");
    }
  } catch (error) {
    console.error("Database connection/migration failed:", error.message);
    console.error("Please verify that PostgreSQL is running and credentials in .env are correct.");
  }
}

// Helper query function
const dbQuery = (text, params) => {
  if (!pool) {
    throw new Error("Database pool not initialized.");
  }
  return pool.query(text, params);
};

// 1. Get All Notifications (with pagination & type filtering)
app.get("/evaluation-service/notifications", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const notificationType = req.query.notification_type;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.payload,
        n.created_at,
        r.is_read,
        r.read_at
      FROM notifications n
      JOIN notification_read_statuses r ON n.id = r.notification_id
      WHERE r.user_id = $1 AND r.is_deleted = FALSE
    `;
    const params = [DEFAULT_STUDENT_ID];

    if (notificationType && notificationType.toLowerCase() !== "all") {
      params.push(notificationType.toLowerCase());
      queryText += ` AND n.type = $2`;
    }

    const paramLength = params.length;
    queryText += ` ORDER BY n.created_at DESC LIMIT $${paramLength + 1} OFFSET $${paramLength + 2}`;
    params.push(limit, offset);

    const dataRes = await dbQuery(queryText, params);

    let countQueryText = `
      SELECT COUNT(*)
      FROM notifications n
      JOIN notification_read_statuses r ON n.id = r.notification_id
      WHERE r.user_id = $1 AND r.is_deleted = FALSE
    `;
    const countParams = [DEFAULT_STUDENT_ID];
    if (notificationType && notificationType.toLowerCase() !== "all") {
      countParams.push(notificationType.toLowerCase());
      countQueryText += ` AND n.type = $2`;
    }

    const countRes = await dbQuery(countQueryText, countParams);
    const totalRecords = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      success: true,
      data: {
        notifications: dataRes.rows,
        pagination: {
          total_records: totalRecords,
          current_page: page,
          total_pages: totalPages || 1,
          limit: limit,
          has_next: page < totalPages,
          has_previous: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Fetch notifications failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch Notification by ID
app.get("/evaluation-service/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT n.id, n.type, n.title, n.message, n.payload, n.created_at, r.is_read, r.read_at
      FROM notifications n
      JOIN notification_read_statuses r ON n.id = r.notification_id
      WHERE r.user_id = $1 AND n.id = $2 AND r.is_deleted = FALSE
    `;
    const result = await dbQuery(query, [DEFAULT_STUDENT_ID, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Mark Notification as Read
app.patch("/evaluation-service/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE notification_read_statuses
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2 AND is_deleted = FALSE
      RETURNING notification_id as id, is_read, read_at
    `;
    const result = await dbQuery(query, [id, DEFAULT_STUDENT_ID]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({
      success: true,
      message: "Notification marked as read successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Mark All Notifications as Read
app.post("/evaluation-service/notifications/read-all", async (req, res) => {
  try {
    const { type } = req.body;
    let query = `
      UPDATE notification_read_statuses r
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      FROM notifications n
      WHERE r.notification_id = n.id 
        AND r.user_id = $1 
        AND r.is_read = FALSE 
        AND r.is_deleted = FALSE
    `;
    const params = [DEFAULT_STUDENT_ID];

    if (type && type.toLowerCase() !== "all") {
      params.push(type.toLowerCase());
      query += ` AND n.type = $2`;
    }

    const result = await dbQuery(query, params);
    res.json({
      success: true,
      message: "All matching notifications marked as read.",
      data: { modified_count: result.rowCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Soft-delete a notification
app.delete("/evaluation-service/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE notification_read_statuses
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1 AND user_id = $2
    `;
    const result = await dbQuery(query, [id, DEFAULT_STUDENT_ID]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }
    res.json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Write Log Entry via Middleware API
app.post("/evaluation-service/logs", async (req, res) => {
  try {
    const { event, status, details } = req.body;
    if (!event || !status) {
      return res.status(400).json({ success: false, error: "Missing event or status fields" });
    }

    await dbQuery(
      "INSERT INTO evaluation_logs (event, status, details) VALUES ($1, $2, $3)",
      [event, status, JSON.stringify(details || {})]
    );

    res.json({ success: true, message: "Log saved successfully" });
  } catch (error) {
    console.error("Failed to write log entry:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Create New Notification (Recruiter/Admin Broadcast API)
app.post("/evaluation-service/notifications", async (req, res) => {
  try {
    const { type, title, message, payload } = req.body;
    if (!type || !title || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields (type, title, message)" });
    }

    const dbRes = await dbQuery(
      "INSERT INTO notifications (type, title, message, payload) VALUES ($1, $2, $3, $4) RETURNING id",
      [type.toLowerCase(), title, message, JSON.stringify(payload || {})]
    );
    const newNotifId = dbRes.rows[0].id;

    // Bulk deliver read status logs to all student users
    const studentsRes = await dbQuery("SELECT id FROM users WHERE role = 'student'");
    for (const student of studentsRes.rows) {
      await dbQuery(
        "INSERT INTO notification_read_statuses (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [newNotifId, student.id]
      );
    }

    res.status(201).json({
      success: true,
      message: "Notification created and broadcast successfully.",
      data: { id: newNotifId },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await initializeDatabase();
});
