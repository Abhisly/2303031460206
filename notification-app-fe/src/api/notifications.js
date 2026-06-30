// ─── AUTH API ─────────────────────────────────────────────────────────────────

const BASE = "/evaluation-service";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("cn_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleRes(res) {
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Request failed");
  return json;
}

export async function apiSignup(name, email, password) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleRes(res);
}

export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleRes(res);
}

export async function apiAdminLogin(email, password) {
  const res = await fetch(`${BASE}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleRes(res);
}

export async function apiMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  return handleRes(res);
}

// ─── NOTIFICATION API ─────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  { id:"m1", type:"placement", title:"Google - Software Engineer FTE Hiring",       message:"Google has opened applications for Software Engineer roles. Eligible branches: CSE, ISE, ECE. Package: 32 LPA. Deadline to apply is tonight.",                         created_at:"2026-06-30T10:00:00Z", is_read:false },
  { id:"m2", type:"result",    title:"Microsoft Recruitments - Final Selects",       message:"The final list of selected students for Microsoft FTE roles has been released. 12 students selected. Congratulations to all selected candidates!",                       created_at:"2026-06-29T18:30:00Z", is_read:false },
  { id:"m3", type:"event",     title:"Annual Tech Fest - Hackathon 2026",             message:"Register for the 24-hour campus hackathon. Cash prizes up to 1.5 Lakhs. Food and merchandise will be provided. Venue: Main Auditorium.",                              created_at:"2026-06-28T09:15:00Z", is_read:true  },
  { id:"m4", type:"placement", title:"Uber - Internship Drive for 3rd Year",          message:"Uber is hiring Summer Interns. CGPA criteria: 8.5+. Stipend: 1.2 LPM. Test schedule will be shared soon via official mail.",                                         created_at:"2026-06-30T12:00:00Z", is_read:false },
  { id:"m5", type:"result",    title:"Amazon Selects - SDE Internships",              message:"Amazon has published results for the online assessment. 45 students have been shortlisted for the interview rounds. Please check your email.",                         created_at:"2026-06-29T14:00:00Z", is_read:true  },
  { id:"m6", type:"event",     title:"Resume Building Seminar by Industry Experts",   message:"Join us in the seminar hall for an interactive workshop on crafting a standout resume for product companies. Speaker: Siddharth (Staff Eng, Netflix).",               created_at:"2026-06-27T11:00:00Z", is_read:true  },
  { id:"m7", type:"placement", title:"Adobe Systems - Product Intern Selection",      message:"Adobe online challenge starts tomorrow at 10 AM on HackerRank. Login credentials will be shared via registered mail. Duration: 120 minutes.",                         created_at:"2026-06-30T06:00:00Z", is_read:false },
  { id:"m8", type:"result",    title:"Goldman Sachs - OA Shortlist",                  message:"Results of Goldman Sachs Online Assessment are out. 30 students are moving to the next interview rounds. Further details will be shared via portal.",                  created_at:"2026-06-28T16:00:00Z", is_read:false },
  { id:"m9", type:"event",     title:"Expert Talk on Generative AI and LLMs",         message:"Professor Radhakrishnan will present recent trends in model optimization and training techniques. Open to all students. 2:00 PM, CSE Seminar Hall.",                   created_at:"2026-06-26T08:00:00Z", is_read:true  },
  { id:"m10",type:"placement", title:"J.P. Morgan - Software Engineer Program",       message:"J.P. Morgan Chase applications are open for Software Engineer roles. Compensation: 19.7 LPA. Minimum CGPA: 7.0. Apply via the placement portal today.",               created_at:"2026-06-29T09:00:00Z", is_read:true  },
];

export async function logToMiddleware(event, status, details = {}) {
  try {
    await fetch(`${BASE}/logs`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ event, status, details, timestamp: new Date().toISOString() }),
    });
  } catch { /* silent */ }
}

export async function fetchNotifications(page = 1, limit = 20, notificationType = null) {
  const token = localStorage.getItem("cn_token");
  if (!token) {
    // Not logged in — return mock data
    let filtered = [...MOCK_NOTIFICATIONS];
    if (notificationType && notificationType !== "all")
      filtered = filtered.filter(n => n.type === notificationType);
    const start = (page - 1) * limit;
    return {
      success: true,
      data: {
        notifications: filtered.slice(start, start + limit),
        pagination: { total_records: filtered.length, current_page: page, total_pages: Math.ceil(filtered.length / limit) || 1, limit },
      },
    };
  }

  let url = `${BASE}/notifications?page=${page}&limit=${limit}`;
  if (notificationType && notificationType !== "all") url += `&notification_type=${notificationType}`;

  try {
    const res = await fetch(url, { headers: authHeaders() });
    return handleRes(res);
  } catch {
    // fallback to mock on network error
    let filtered = [...MOCK_NOTIFICATIONS];
    if (notificationType && notificationType !== "all")
      filtered = filtered.filter(n => n.type === notificationType);
    const start = (page - 1) * limit;
    return {
      success: true,
      data: {
        notifications: filtered.slice(start, start + limit),
        pagination: { total_records: filtered.length, current_page: page, total_pages: Math.ceil(filtered.length / limit) || 1, limit },
      },
    };
  }
}

export async function markRead(id) {
  try {
    const res = await fetch(`${BASE}/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() });
    return handleRes(res);
  } catch { /* silent */ }
}

// HR/Admin APIs
export async function postNotification(data) {
  const res = await fetch(`${BASE}/notifications`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function fetchAdminNotifications() {
  const res = await fetch(`${BASE}/admin/notifications`, { headers: authHeaders() });
  return handleRes(res);
}

export async function fetchStudents() {
  const res = await fetch(`${BASE}/admin/students`, { headers: authHeaders() });
  return handleRes(res);
}
