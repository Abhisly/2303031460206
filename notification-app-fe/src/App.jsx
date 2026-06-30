import { useState, useEffect, useRef } from "react";
import {
  fetchNotifications,
  apiSignup,
  apiLogin,
  apiAdminLogin,
  apiMe,
  postNotification,
  fetchAdminNotifications,
  markRead,
  logToMiddleware
} from "./api/notifications";
import { sortNotifications } from "./utils/priority";

/* ─── ICONS (inline SVG) ────────────────────────────────────── */
const Icon = ({ path, size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

const Icons = {
  search:     "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  chevLeft:   "M15 18l-6-6 6-6",
  chevRight:  "M9 18l6-6-6-6",
  logout:     "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  alert:      ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  inbox:      ["M22 12h-6l-2 3h-4l-2-3H2","M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
  refresh:    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  close:      "M18 6L6 18M6 6l12 12",
  arrowLeft:  "M19 12H5M12 19l-7-7 7-7",
  plus:       "M12 5v14M5 12h14",
  history:    "M12 8v4l3 3M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
};

/* ─── HELPERS ────────────────────────────────────────────────── */
function formatTime(dateStr) {
  if (!dateStr) return "Just now";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "Today";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getInitials(name) {
  if (!name) return "ST";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ─── BACKGROUND GLOW ────────────────────────────────────────── */
function Background() {
  return <div className="bg-glow" />;
}

/* ─── TYPOGRAPHY LOGO ────────────────────────────────────────── */
function Logo() {
  return (
    <div className="navbar-brand">
      <span className="brand-campus">CAMPUS</span>
      <span className="brand-notify">Notify</span>
    </div>
  );
}

/* ─── CATEGORY BADGE ────────────────────────────────────────── */
function CategoryBadge({ type }) {
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : "—";
  return <span className={`category-badge ${type?.toLowerCase()}`}>{label}</span>;
}

/* ─── SLIDE-OVER DETAIL COMPONENT ────────────────────────────── */
function SlideOver({ notification, isOpen, onClose }) {
  if (!notification) return null;

  const payload = notification.payload || {};
  const department = payload.department || "Campus Administration";
  const publishedBy = payload.publishedBy || "Academic Cell";
  const audience = payload.audience || "All Students";
  const priority = notification.type === "placement" ? "High" : "Standard";
  const attachment = payload.attachment || null;
  const externalLink = payload.externalLink || null;

  return (
    <>
      <div className={`slide-over-backdrop ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`slide-over-panel ${isOpen ? "open" : ""}`}>
        <button className="slide-over-close" onClick={onClose}>
          <Icon path={Icons.close} size={16} />
          <span>Close Details</span>
        </button>

        <div className="slide-over-header">
          <div className="slide-over-meta-row">
            <CategoryBadge type={notification.type} />
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {formatDate(notification.created_at || notification.createdAt)}
            </span>
          </div>
          <h2 className="slide-over-title">{notification.title}</h2>
        </div>

        <div className="slide-over-body">
          <div className="slide-over-details-grid">
            <span className="grid-label">Type</span>
            <span className="grid-value" style={{ textTransform: "capitalize" }}>{notification.type}</span>

            <span className="grid-label">Department</span>
            <span className="grid-value">{department}</span>

            <span className="grid-label">Published By</span>
            <span className="grid-value">{publishedBy}</span>

            <span className="grid-label">Audience</span>
            <span className="grid-value">{audience}</span>

            <span className="grid-label">Date & Time</span>
            <span className="grid-value">
              {formatDate(notification.created_at || notification.createdAt)} at {formatTime(notification.created_at || notification.createdAt)}
            </span>

            <span className="grid-label">Priority</span>
            <span className="grid-value" style={{ color: priority === "High" ? "#f87171" : "var(--text-primary)" }}>
              {priority}
            </span>
          </div>

          <div className="slide-over-divider" />

          <h3 className="slide-over-content-title">Announcement Message</h3>
          <p className="slide-over-content">{notification.message}</p>

          {Object.keys(payload).length > 0 && (
            <>
              <div className="slide-over-divider" />
              <h3 className="slide-over-content-title">Additional Info</h3>
              <div className="slide-over-details-grid">
                {Object.entries(payload).map(([k, v]) => {
                  if (["department", "publishedBy", "audience", "attachment", "externalLink"].includes(k)) return null;
                  return (
                    <span key={k} style={{ display: "contents" }}>
                      <span className="grid-label" style={{ textTransform: "capitalize" }}>{k}</span>
                      <span className="grid-value">{String(v)}</span>
                    </span>
                  );
                })}
              </div>
            </>
          )}

          {attachment && (
            <>
              <div className="slide-over-divider" />
              <h3 className="slide-over-content-title">Attachments</h3>
              <a href={attachment} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "var(--accent-500)", textDecoration: "underline" }}>
                Download Resource Document
              </a>
            </>
          )}

          {externalLink && (
            <>
              <div className="slide-over-divider" />
              <h3 className="slide-over-content-title">Links</h3>
              <a href={externalLink} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "var(--accent-500)", textDecoration: "underline" }}>
                Apply / Visit Portal
              </a>
            </>
          )}
        </div>

        <div className="slide-over-actions">
          <button className="btn-detail-primary" onClick={onClose}>Acknowledge</button>
          <button className="btn-detail-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

/* ─── NOTIFICATION ROW ───────────────────────────────────────── */
function NotifRow({ notification, rank, onSelectRow }) {
  const isUnread = notification.is_read === false;
  const payload = notification.payload || {};
  const department = payload.department || "Academic Cell";

  return (
    <div
      onClick={() => onSelectRow(notification)}
      className={`notif-row ${isUnread ? "unread-row" : ""}`}
    >
      <div className="status-dot-col">
        <span className={`status-dot ${isUnread ? "unread" : "read"}`} />
      </div>

      <div className="notif-content-col">
        <div className="notif-title">
          {notification.title}
        </div>
        {/* Shows full description text wrap naturally */}
        <div className="notif-desc">
          {notification.message}
        </div>
      </div>

      <div className="notif-category-col">
        <CategoryBadge type={notification.type} />
      </div>

      <div className="notif-source-col">
        {department}
      </div>

      <div className="notif-time-col">
        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
          {formatTime(notification.created_at || notification.createdAt)}
        </div>
        <div style={{ fontSize: 12, marginTop: 2 }}>
          {formatDate(notification.created_at || notification.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ─── AUTHENTICATION PAGE ─────────────────────────────────────── */
function AuthPage({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("student_login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (activeTab === "student_signup") {
        const res = await apiSignup(name, email, password);
        localStorage.setItem("cn_token", res.data.token);
        localStorage.setItem("cn_user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else if (activeTab === "student_login") {
        const res = await apiLogin(email, password);
        localStorage.setItem("cn_token", res.data.token);
        localStorage.setItem("cn_user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else if (activeTab === "hr_login") {
        const res = await apiAdminLogin(email, password);
        localStorage.setItem("cn_token", res.data.token);
        localStorage.setItem("cn_user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoHR = () => {
    setEmail("hr123@gmail.com");
    setPassword("hrpass@123");
    setActiveTab("hr_login");
    setError("");
  };

  return (
    <div className="auth-shell">
      {/* Left Column - Editorial Hero Content */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-badge">Campus Notify Platform</div>
          <h1 className="auth-hero-heading">
            The central hub for academic updates & career placements.
          </h1>
          <p className="auth-hero-subtext">
            Stay informed with real-time official announcements, event schedules, and direct recruitment pathways from top recruiters.
          </p>
          
          <div className="auth-hero-footer">
            <div className="hero-stat-pill">
              <span className="hero-stat-num">100%</span>
              <span className="hero-stat-label">Placement Transparency</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-num">Realtime</span>
              <span className="hero-stat-label">Push Broadcasting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Cardless Floating Form Container */}
      <div className="auth-form-container">
        <div className="auth-form-inner">
          <div className="auth-brand-mobile">
            <Logo />
            <span className="auth-tagline">NOTIFICATION HUB</span>
          </div>

          <div className="portal-selector">
            <button
              className={`portal-btn ${activeTab.startsWith("student") ? "active" : ""}`}
              onClick={() => {
                setActiveTab("student_login");
                setError("");
              }}
            >
              Student Portal
            </button>
            <button
              className={`portal-btn ${activeTab === "hr_login" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("hr_login");
                setError("");
              }}
            >
              HR / Placement
            </button>
          </div>

          <h2 className="auth-title">
            {activeTab === "student_signup" && "Create Student Profile"}
            {activeTab === "student_login" && "Student Login"}
            {activeTab === "hr_login" && "HR Portal"}
          </h2>
          <p className="auth-sub">
            {activeTab === "student_signup" && "Register to receive academic and job updates."}
            {activeTab === "student_login" && "Enter your credentials to continue."}
            {activeTab === "hr_login" && "Broadcast notifications and monitor metrics."}
          </p>

          {activeTab === "hr_login" && (
            <div className="demo-strip">
              <span className="demo-label">HR / Admin Account Demo</span>
              <div className="demo-cred-row">
                <span className="demo-cred-pill">Email: hr123@gmail.com</span>
                <span className="demo-cred-pill">Password: hrpass@123</span>
              </div>
              <button type="button" className="demo-btn" onClick={handleUseDemoHR}>
                Apply Demo Credentials
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {activeTab === "student_signup" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Jane Doe"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="jane@university.edu"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Authenticating..." : activeTab === "student_signup" ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="auth-switch">
            {activeTab === "student_login" && (
              <span>
                Create a student account?{" "}
                <span onClick={() => { setActiveTab("student_signup"); setError(""); }}>
                  Register here
                </span>
              </span>
            )}
            {activeTab === "student_signup" && (
              <span>
                Already have an account?{" "}
                <span onClick={() => { setActiveTab("student_login"); setError(""); }}>
                  Log in
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── STATS ROW ──────────────────────────────────────────────── */
function StatsRow({ notifications }) {
  const total = notifications.length;
  const unread = notifications.filter(n => !n.is_read).length;
  const placements = notifications.filter(n => n.type === "placement").length;
  const events = notifications.filter(n => n.type === "event").length;

  return (
    <div className="stats-row">
      <div className="stat-cell">
        <span className="stat-label">Feed Volume</span>
        <span className="stat-value">{total}</span>
        <span className="stat-sub">Total notifications</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Unread Feeds</span>
        <span className="stat-value stat-accent">{unread}</span>
        <span className="stat-sub">Awaiting review</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Placement Drives</span>
        <span className="stat-value">{placements}</span>
        <span className="stat-sub">Active campaigns</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Events & Seminars</span>
        <span className="stat-value" style={{ color: "#f59e0b" }}>{events}</span>
        <span className="stat-sub">Important activities</span>
      </div>
    </div>
  );
}

/* ─── ALL NOTIFICATIONS FEED PAGE ────────────────────────────── */
function AllNotificationsPage({
  filter,
  setFilter,
  search,
  setSearch,
  onSelectRow,
  refreshTrigger
}) {
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [notifications, setNotifs]  = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotal]    = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const loadNotifs = () => {
    setLoading(true);
    setError(null);
    fetchNotifications(page, limit, filter)
      .then(res => {
        const raw  = res?.data?.notifications || res?.notifications || [];
        const pg   = res?.data?.pagination    || res?.pagination    || {};
        setNotifs(sortNotifications(raw));
        setTotalPages(pg.total_pages  || 1);
        setTotal(pg.total_records     || raw.length);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    loadNotifs();
  }, [page, limit, filter, refreshTrigger]);

  const visible = notifications.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">
            {totalRecords} records found {filter !== "all" ? `under "${filter}"` : ""}
          </p>
        </div>
      </div>

      <StatsRow notifications={notifications} />

      <div className="notification-feed">
        <div className="feed-header">
          <span></span>
          <span>Notification</span>
          <span>Category</span>
          <span>Source</span>
          <span style={{ textAlign: "right" }}>Published</span>
        </div>

        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <span className="state-sub">Loading vertical feed...</span>
          </div>
        )}

        {!loading && error && (
          <div className="state-container">
            <div className="alert error">
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="state-container">
            <Icon path={Icons.inbox} size={36} style={{ color: "var(--text-disabled)" }} />
            <span className="state-title">Inbox empty</span>
            <span className="state-sub">{search ? "No matching records found." : "No announcements posted."}</span>
          </div>
        )}

        {!loading && !error && visible.map(n => (
          <NotifRow key={n.id || n.created_at} notification={n} onSelectRow={onSelectRow} />
        ))}

        {!loading && !error && totalPages > 1 && (
          <div className="pagination-bar">
            <span className="page-info">
              {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)} of {totalRecords}
            </span>
            <div className="page-controls">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <Icon path={Icons.chevLeft} size={12} />
              </button>
              {pages.map(p => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <Icon path={Icons.chevRight} size={12} />
              </button>
            </div>
            <select
              className="rows-select"
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 20].map(v => (
                <option key={v} value={v}>{v} / page</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── PRIORITY NOTIFICATIONS FEED PAGE ───────────────────────── */
function PriorityPage({ search, onSelectRow }) {
  const [notifications, setNotifs]  = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const loadNotifs = () => {
    setLoading(true);
    setError(null);
    fetchNotifications(1, 100, "all")
      .then(res => {
        const raw = res?.data?.notifications || res?.notifications || [];
        setNotifs(sortNotifications(raw));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const visible = notifications.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Priority Queue</h1>
          <p className="page-subtitle">Ranked by placement relevance and date</p>
        </div>
      </div>

      <div className="notification-feed">
        <div className="feed-header">
          <span></span>
          <span>Notification</span>
          <span>Category</span>
          <span>Source</span>
          <span style={{ textAlign: "right" }}>Published</span>
        </div>

        {loading && (
          <div className="state-container">
            <div className="spinner" />
          </div>
        )}

        {!loading && error && (
          <div className="state-container">
            <div className="alert error"><span>{error}</span></div>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="state-container">
            <Icon path={Icons.inbox} size={36} style={{ color: "var(--text-disabled)" }} />
            <span className="state-title">No priority items</span>
          </div>
        )}

        {!loading && !error && visible.map(n => (
          <NotifRow key={n.id || n.created_at} notification={n} onSelectRow={onSelectRow} />
        ))}
      </div>
    </>
  );
}

/* ─── HR & ADMIN BROADCAST INTERFACE ────────────────────────── */
function HRAdminPortal({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState("broadcast"); // broadcast, history
  const [type, setType] = useState("placement");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [payloadKey, setPayloadKey] = useState("");
  const [payloadValue, setPayloadValue] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadHistory = () => {
    fetchAdminNotifications()
      .then(res => {
        setHistory(res.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {};
    if (payloadKey.trim() && payloadValue.trim()) {
      payload[payloadKey.trim()] = payloadValue.trim();
    }
    // inject default department/publishedBy payload items
    payload["department"] = "HR & Placement Cell";
    payload["publishedBy"] = user?.name || "HR Officer";

    try {
      await postNotification({ type, title, message, payload });
      setSuccess("Announcement broadcasted successfully to all students.");
      setTitle("");
      setMessage("");
      setPayloadKey("");
      setPayloadValue("");
    } catch (err) {
      setError(err.message || "Failed to post announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell">
      <header className="navbar">
        <Logo />
        <div className="navbar-nav">
          <span
            className={`navbar-link ${activeTab === "broadcast" ? "active" : ""}`}
            onClick={() => setActiveTab("broadcast")}
          >
            New Broadcast
          </span>
          <span
            className={`navbar-link ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Broadcast History
          </span>
        </div>
        <div className="navbar-right">
          <div className="navbar-user">
            <div className="navbar-avatar">{getInitials(user?.name)}</div>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
          </div>
          <button className="navbar-signout-btn" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeTab === "broadcast" && (
          <div className="compose-card">
            <h2 className="compose-title">Create Announcement</h2>
            <p className="compose-sub">Submit details to instantly notify all campuses.</p>

            {success && <div className="form-success">{success}</div>}
            {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="type-pill-group">
                  <button
                    type="button"
                    className={`type-pill ${type === "placement" ? "active placement" : ""}`}
                    onClick={() => setType("placement")}
                  >
                    Placement
                  </button>
                  <button
                    type="button"
                    className={`type-pill ${type === "result" ? "active result" : ""}`}
                    onClick={() => setType("result")}
                  >
                    Result
                  </button>
                  <button
                    type="button"
                    className={`type-pill ${type === "event" ? "active event" : ""}`}
                    onClick={() => setType("event")}
                  >
                    Event
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Oracle FTE Drive Openings"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message details</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter full comprehensive message details."
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="form-label">Payload Info Key (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Package"
                    value={payloadKey}
                    onChange={e => setPayloadKey(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Payload Value (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 18 LPA"
                    value={payloadValue}
                    onChange={e => setPayloadValue(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: "auto", padding: "10px 24px" }}>
                {loading ? "Posting..." : "Broadcast Announcement"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">History Feed</h1>
                <p className="page-subtitle">Overview of all broadcasted notifications</p>
              </div>
            </div>

            <div className="sent-history-feed">
              <div className="sent-row" style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid var(--border-subtle)", fontWeight: 500, color: "var(--text-muted)", fontSize: 13 }}>
                <span>Announcement</span>
                <span>Type</span>
                <span>Read Rate</span>
                <span style={{ textAlign: "right" }}>Sent Date</span>
              </div>

              {history.length === 0 && (
                <div className="state-container">
                  <span className="state-sub">No announcements broadcasted yet.</span>
                </div>
              )}

              {history.map(item => (
                <div key={item.id} className="sent-row">
                  <div>
                    <div className="sent-row-title">{item.title}</div>
                    <div className="sent-row-msg">{item.message}</div>
                  </div>
                  <div>
                    <CategoryBadge type={item.type} />
                  </div>
                  <div className="sent-read-stat">
                    <strong>{item.read_count}</strong> / {item.total_recipients} read
                  </div>
                  <div className="notif-time-col">
                    {formatDate(item.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── MAIN APP COMPONENT ─────────────────────────────────────── */
export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("all"); // all, priority
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Detail drawer states
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("cn_token");
    const localUser = localStorage.getItem("cn_user");

    if (token && localUser) {
      setUser(JSON.parse(localUser));

      apiMe()
        .then(res => {
          if (res.data) {
            setUser(res.data);
            localStorage.setItem("cn_user", JSON.stringify(res.data));
          }
        })
        .catch(() => {
          handleSignOut();
        })
        .finally(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("cn_token");
    localStorage.removeItem("cn_user");
    setUser(null);
  };

  const handleSelectRow = (notif) => {
    setSelectedNotif(notif);
    setIsDrawerOpen(true);

    if (notif.is_read === false) {
      markRead(notif.id)
        .then(() => {
          setRefreshTrigger(prev => prev + 1);
        })
        .catch(() => {});
    }
  };

  if (checkingAuth) {
    return (
      <div className="auth-shell">
        <Background />
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Background />
        <AuthPage onLoginSuccess={(u) => setUser(u)} />
      </>
    );
  }

  if (user.role === "hr" || user.role === "admin") {
    return (
      <>
        <Background />
        <HRAdminPortal user={user} onSignOut={handleSignOut} />
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="app-shell">
        {/* Horizontal Navigation Topbar */}
        <header className="navbar">
          <Logo />

          <div className="navbar-nav">
            <span
              className={`navbar-link ${activePage === "all" ? "active" : ""}`}
              onClick={() => setActivePage("all")}
            >
              All Notifications
            </span>
            <span
              className={`navbar-link ${activePage === "priority" ? "active" : ""}`}
              onClick={() => setActivePage("priority")}
            >
              Priority Queue
            </span>
          </div>

          <div className="navbar-right">
            {/* Simple Search bar */}
            <div className="navbar-search">
              <span className="navbar-search-icon">
                <Icon path={Icons.search} size={14} />
              </span>
              <input
                type="text"
                placeholder="Search notifications..."
                className="navbar-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filter controls */}
            {activePage === "all" && (
              <select
                className="navbar-filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="placement">Placements</option>
                <option value="result">Results</option>
                <option value="event">Events</option>
              </select>
            )}

            {/* Profile Avatar info */}
            <div className="navbar-user">
              <div className="navbar-avatar">{getInitials(user?.name)}</div>
              <span className="navbar-signout-btn" onClick={handleSignOut}>
                Sign Out
              </span>
            </div>
          </div>
        </header>

        <main className="main-content">
          {activePage === "all" && (
            <AllNotificationsPage
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              onSelectRow={handleSelectRow}
              refreshTrigger={refreshTrigger}
            />
          )}
          {activePage === "priority" && (
            <PriorityPage
              search={search}
              onSelectRow={handleSelectRow}
            />
          )}
        </main>
      </div>

      {/* Slide-Over Drawer Details */}
      <SlideOver
        notification={selectedNotif}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}