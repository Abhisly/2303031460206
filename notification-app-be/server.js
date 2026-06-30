import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "campus_notify_secret_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

app.use(cors());
app.use(express.json());

// ─── DB SETUP ────────────────────────────────────────────────────────────────
const pgConfig = {
  host: process.env.PGHOST || "localhost",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  port: parseInt(process.env.PGPORT || "5432", 10),
};
const targetDatabase = process.env.PGDATABASE || "campus_notifications";
let pool = null;

// ─── SCHEMA DDL ──────────────────────────────────────────────────────────────
const DDL_STATEMENTS = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'admin', 'hr')),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type       VARCHAR(50) NOT NULL CHECK (type IN ('placement', 'result', 'event')),
    title      VARCHAR(255) NOT NULL,
    message    TEXT NOT NULL,
    payload    JSONB DEFAULT NULL,
    sender_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_read_statuses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT uq_user_notification UNIQUE (user_id, notification_id)
);

CREATE TABLE IF NOT EXISTS evaluation_logs (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event     VARCHAR(255) NOT NULL,
    status    VARCHAR(50)  NOT NULL,
    user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    details   JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_read_statuses_unread
  ON notification_read_statuses(user_id)
  WHERE is_read = FALSE AND is_deleted = FALSE;
`;

// ─── SEEDING ──────────────────────────────────────────────────────────────────
const SEED_NOTIFICATIONS = [
  { type: "placement", title: "Google - Software Engineer FTE Hiring",       message: "Google has opened applications for Software Engineer roles. Eligible branches: CSE, ISE, ECE. Package: 32 LPA. Deadline to apply is tonight.", payload: { salary_package: "32 LPA", eligible_branches: "CSE, ISE, ECE", deadline: "Tonight" } },
  { type: "result",    title: "Microsoft Recruitments - Final Selects",       message: "The final list of selected students for Microsoft FTE roles has been released. 12 students selected. Click to view results.", payload: { selected_count: "12", company: "Microsoft" } },
  { type: "event",     title: "Annual Tech Fest - Hackathon 2026",             message: "Register for the 24-hour campus hackathon. Cash prizes up to 1.5 Lakhs. Food and merchandise will be provided.", payload: { venue: "Main Auditorium", duration: "24 Hours", prize_pool: "1.5 Lakhs" } },
  { type: "placement", title: "Uber - Internship Drive for 3rd Year",          message: "Uber is hiring Summer Interns. CGPA criteria: 8.5+. Test schedule will be shared soon.", payload: { stipend: "1.2 LPM", cgpa_cutoff: "8.5" } },
  { type: "result",    title: "Amazon Selects - SDE Internships",              message: "Amazon has published results for the online assessment. 45 students shortlisted for interviews.", payload: { shortlisted_students: "45", role: "SDE Intern" } },
  { type: "event",     title: "Resume Building Seminar by Industry Experts",   message: "Join us in the seminar hall for an interactive workshop on crafting a standout resume for product companies.", payload: { speaker: "Siddharth (Staff Eng, Netflix)", venue: "Seminar Hall 2" } },
  { type: "placement", title: "Adobe Systems - Product Intern Selection",      message: "Adobe online challenge starts tomorrow at 10 AM on HackerRank. Logins will be shared via registered mail.", payload: { portal: "HackerRank", test_duration: "120 mins" } },
  { type: "result",    title: "Goldman Sachs - OA Shortlist",                  message: "Results of Goldman Sachs Online Assessment are out. 30 students are moving to interview rounds.", payload: { company: "Goldman Sachs", candidates_count: "30" } },
  { type: "event",     title: "Expert Talk on Generative AI and LLMs",         message: "Professor Radhakrishnan will present recent trends in model optimization and training techniques.", payload: { speaker: "Dr. Radhakrishnan", time: "2:00 PM" } },
  { type: "placement", title: "J.P. Morgan - Software Engineer Program",       message: "J.P. Morgan Chase & Co. applications are open. CGPA: 7.0+ eligible.", payload: { role: "Software Engineer", compensation: "19.7 LPA" } },
];

async function ensureDatabaseExists() {
  const adminClient = new pg.Client({ ...pgConfig, database: "postgres" });
  try {
    await adminClient.connect();
    const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDatabase]);
    if (res.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✓ Database "${targetDatabase}" created.`);
    }
  } catch (e) {
    console.warn("Warning: could not ensure DB exists:", e.message);
  } finally {
    await adminClient.end().catch(() => {});
  }
}

async function initializeDatabase() {
  await ensureDatabaseExists();
  pool = new pg.Pool({ ...pgConfig, database: targetDatabase, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });

  try {
    await pool.query(DDL_STATEMENTS);
    console.log("✓ Schema verified.");

    // ── Seed HR demo account ──────────────────────────────────────────────────
    const hrEmail = "hr123@gmail.com";
    const hrExists = await pool.query("SELECT id FROM users WHERE email = $1", [hrEmail]);
    if (hrExists.rows.length === 0) {
      const hrHash = await bcrypt.hash("hrpass@123", 10);
      await pool.query(
        "INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)",
        [hrEmail, hrHash, "hr", "HR & Placement Cell"]
      );
      console.log(`✓ HR demo account seeded: ${hrEmail}`);
    }

    // ── Seed admin demo account ───────────────────────────────────────────────
    const adminEmail = "admin@campus.edu";
    const adminExists = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (adminExists.rows.length === 0) {
      const adminHash = await bcrypt.hash("hrpass@123", 10);
      await pool.query(
        "INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4)",
        [adminEmail, adminHash, "admin", "Campus Admin"]
      );
      console.log(`✓ Admin demo account seeded: ${adminEmail}`);
    }

    // ── Seed notifications if empty ───────────────────────────────────────────
    const notifCount = await pool.query("SELECT COUNT(*) FROM notifications");
    if (parseInt(notifCount.rows[0].count, 10) === 0) {
      const students = await pool.query("SELECT id FROM users WHERE role = 'student'");
      for (const n of SEED_NOTIFICATIONS) {
        const res = await pool.query(
          "INSERT INTO notifications (type, title, message, payload) VALUES ($1, $2, $3, $4) RETURNING id",
          [n.type, n.title, n.message, JSON.stringify(n.payload)]
        );
        const notifId = res.rows[0].id;
        for (const s of students.rows) {
          await pool.query(
            "INSERT INTO notification_read_statuses (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [notifId, s.id]
          );
        }
      }
      console.log("✓ Seed notifications inserted.");
    }
  } catch (e) {
    console.error("✗ DB init failed:", e.message);
  }
}

const dbQuery = (text, params) => {
  if (!pool) throw new Error("DB pool not ready.");
  return pool.query(text, params);
};

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized: no token." });
    }
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
      req.user = payload;
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ success: false, error: "Forbidden: insufficient role." });
      }
      next();
    } catch {
      return res.status(401).json({ success: false, error: "Unauthorized: invalid token." });
    }
  };
}

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// Student Sign Up
app.post("/evaluation-service/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: "Name, email, and password are required." });
    if (password.length < 6)
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });

    const existing = await dbQuery("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, error: "An account with this email already exists." });

    const hash = await bcrypt.hash(password, 10);
    const result = await dbQuery(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'student') RETURNING id, name, email, role, created_at",
      [name.trim(), email.toLowerCase(), hash]
    );
    const user = result.rows[0];

    // Auto-assign existing notifications to new student
    const notifs = await dbQuery("SELECT id FROM notifications", []);
    for (const n of notifs.rows) {
      await dbQuery(
        "INSERT INTO notification_read_statuses (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [n.id, user.id]
      );
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({ success: true, message: "Account created successfully.", data: { token, user } });
  } catch (e) {
    console.error("Signup error:", e.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// Student Login
app.post("/evaluation-service/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Email and password are required." });

    const result = await dbQuery("SELECT * FROM users WHERE email = $1 AND role = 'student'", [email.toLowerCase()]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, error: "Invalid email or password." });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, error: "Invalid email or password." });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// HR / Admin Login (separate portal)
app.post("/evaluation-service/auth/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Email and password are required." });

    const result = await dbQuery(
      "SELECT * FROM users WHERE email = $1 AND role IN ('admin', 'hr')",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, error: "Invalid credentials or not an admin/HR account." });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, error: "Invalid email or password." });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// Verify token
app.get("/evaluation-service/auth/me", requireAuth(), async (req, res) => {
  const result = await dbQuery("SELECT id, name, email, role, created_at FROM users WHERE id = $1", [req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ success: false, error: "User not found." });
  res.json({ success: true, data: result.rows[0] });
});

// ─── NOTIFICATION ROUTES (Student — require login) ────────────────────────────

// GET all notifications for the logged-in student
app.get("/evaluation-service/notifications", requireAuth(["student"]), async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || "1",  10);
    const limit = parseInt(req.query.limit || "20", 10);
    const notificationType = req.query.notification_type;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let q = `
      SELECT n.id, n.type, n.title, n.message, n.payload, n.created_at, r.is_read, r.read_at
      FROM notifications n
      JOIN notification_read_statuses r ON n.id = r.notification_id
      WHERE r.user_id = $1 AND r.is_deleted = FALSE
    `;
    const params = [userId];

    if (notificationType && notificationType.toLowerCase() !== "all") {
      params.push(notificationType.toLowerCase());
      q += ` AND n.type = $${params.length}`;
    }

    const pl = params.length;
    q += ` ORDER BY n.created_at DESC LIMIT $${pl + 1} OFFSET $${pl + 2}`;
    params.push(limit, offset);

    const [dataRes, countRes] = await Promise.all([
      dbQuery(q, params),
      dbQuery(
        `SELECT COUNT(*) FROM notifications n
         JOIN notification_read_statuses r ON n.id = r.notification_id
         WHERE r.user_id = $1 AND r.is_deleted = FALSE${
           notificationType && notificationType.toLowerCase() !== "all"
             ? ` AND n.type = '${notificationType.toLowerCase()}'`
             : ""
         }`,
        [userId]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    res.json({
      success: true,
      data: {
        notifications: dataRes.rows,
        pagination: { total_records: total, current_page: page, total_pages: Math.ceil(total / limit) || 1, limit, has_next: page < Math.ceil(total / limit), has_previous: page > 1 },
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET single notification
app.get("/evaluation-service/notifications/:id", requireAuth(["student"]), async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT n.id, n.type, n.title, n.message, n.payload, n.created_at, r.is_read
       FROM notifications n
       JOIN notification_read_statuses r ON n.id = r.notification_id
       WHERE r.user_id = $1 AND n.id = $2 AND r.is_deleted = FALSE`,
      [req.user.id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: "Not found." });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PATCH mark as read
app.patch("/evaluation-service/notifications/:id/read", requireAuth(["student"]), async (req, res) => {
  try {
    const result = await dbQuery(
      `UPDATE notification_read_statuses SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id as id, is_read, read_at`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: "Not found." });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST mark all read
app.post("/evaluation-service/notifications/read-all", requireAuth(["student"]), async (req, res) => {
  try {
    const { type } = req.body;
    let q = `UPDATE notification_read_statuses r SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
             FROM notifications n WHERE r.notification_id = n.id AND r.user_id = $1 AND r.is_read = FALSE AND r.is_deleted = FALSE`;
    const params = [req.user.id];
    if (type && type.toLowerCase() !== "all") { params.push(type.toLowerCase()); q += ` AND n.type = $2`; }
    const result = await dbQuery(q, params);
    res.json({ success: true, data: { modified_count: result.rowCount } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE soft-delete
app.delete("/evaluation-service/notifications/:id", requireAuth(["student"]), async (req, res) => {
  try {
    await dbQuery(
      `UPDATE notification_read_statuses SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
       WHERE notification_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: "Deleted." });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── HR / ADMIN ROUTES ────────────────────────────────────────────────────────

// POST create & broadcast notification (HR or Admin only)
app.post("/evaluation-service/notifications", requireAuth(["admin", "hr"]), async (req, res) => {
  try {
    const { type, title, message, payload } = req.body;
    if (!type || !title || !message)
      return res.status(400).json({ success: false, error: "type, title, and message are required." });

    const notifRes = await dbQuery(
      "INSERT INTO notifications (type, title, message, payload, sender_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [type.toLowerCase(), title, message, JSON.stringify(payload || {}), req.user.id]
    );
    const notifId = notifRes.rows[0].id;

    const students = await dbQuery("SELECT id FROM users WHERE role = 'student'");
    for (const s of students.rows) {
      await dbQuery(
        "INSERT INTO notification_read_statuses (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [notifId, s.id]
      );
    }

    res.status(201).json({ success: true, message: "Broadcast sent.", data: { id: notifId, broadcast_to: students.rows.length } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET all notifications sent (HR/Admin dashboard)
app.get("/evaluation-service/admin/notifications", requireAuth(["admin", "hr"]), async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT n.*, u.name as sender_name,
              (SELECT COUNT(*) FROM notification_read_statuses r WHERE r.notification_id = n.id AND r.is_read = TRUE) as read_count,
              (SELECT COUNT(*) FROM notification_read_statuses r WHERE r.notification_id = n.id) as total_recipients
       FROM notifications n LEFT JOIN users u ON n.sender_id = u.id
       ORDER BY n.created_at DESC LIMIT 100`,
      []
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET student list (Admin only)
app.get("/evaluation-service/admin/students", requireAuth(["admin", "hr"]), async (req, res) => {
  try {
    const result = await dbQuery(
      "SELECT id, name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC",
      []
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── LOGGING ─────────────────────────────────────────────────────────────────
app.post("/evaluation-service/logs", async (req, res) => {
  try {
    const { event, status, details } = req.body;
    const userId = req.user?.id || null;
    await dbQuery(
      "INSERT INTO evaluation_logs (event, status, user_id, details) VALUES ($1, $2, $3, $4)",
      [event, status, userId, JSON.stringify(details || {})]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Campus Notify API running on http://localhost:${PORT}`);
  await initializeDatabase();
});
