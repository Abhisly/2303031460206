import { useState, useEffect, useRef } from "react";
import { fetchNotifications } from "./api/notifications";
import { sortNotifications } from "./utils/priority";

/* ─── ICONS (inline SVG) ────────────────────────────────────── */
const Icon = ({ path, size = 14, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
);

const Icons = {
  bell:       "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  star:       "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  search:     "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  sliders:    ["M4 21v-7","M4 10V3","M12 21v-9","M12 8V3","M20 21v-5","M20 12V3","M1 14h6","M9 8h6","M17 16h6"],
  chevDown:   "M6 9l6 6 6-6",
  chevLeft:   "M15 18l-6-6 6-6",
  chevRight:  "M9 18l6-6-6-6",
  logout:     "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  circle:     "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  alert:      ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  inbox:      ["M22 12h-6l-2 3h-4l-2-3H2","M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
  refresh:    "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

/* ─── HELPERS ────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function truncate(str, n) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

/* ─── BACKGROUND LAYERS ─────────────────────────────────────── */
function Background() {
  return (
    <>
      <div className="bg-grid" />
      <div className="bg-glow" />
    </>
  );
}

/* ─── TYPE BADGE ─────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const label = type ? type.charAt(0).toUpperCase() + type.slice(1) : "—";
  return <span className={`type-badge ${type?.toLowerCase()}`}>{label}</span>;
}

/* ─── SIDEBAR ────────────────────────────────────────────────── */
function Sidebar({ activePage, onPageChange, activeFilter, onFilterChange }) {
  const pages = [
    { id: "all",      label: "All Notifications", icon: Icons.bell },
    { id: "priority", label: "Priority Alerts",   icon: Icons.star  },
  ];

  const filters = [
    { id: "all",       label: "All",       dotClass: "all"       },
    { id: "placement", label: "Placement", dotClass: "placement" },
    { id: "result",    label: "Result",    dotClass: "result"    },
    { id: "event",     label: "Event",     dotClass: "event"     },
  ];

  return (
    <nav className="sidebar">
      {/* Wordmark */}
      <div className="wordmark">
        <div className="wordmark-text">Campus Notify</div>
        <div className="wordmark-sub">Notification Hub</div>
      </div>

      {/* Primary navigation */}
      <div className="nav-section">
        <div className="nav-label">Navigation</div>
        {pages.map(p => (
          <div
            key={p.id}
            className={`nav-item ${activePage === p.id ? "active" : ""}`}
            onClick={() => onPageChange(p.id)}
          >
            <Icon path={p.icon} size={14} className="nav-icon" />
            {p.label}
          </div>
        ))}
      </div>

      {/* Type filters */}
      <div className="nav-section" style={{ marginTop: 24 }}>
        <div className="nav-label">Notification Type</div>
        {filters.map(f => (
          <div
            key={f.id}
            className={`type-item ${activeFilter === f.id ? "active" : ""}`}
            onClick={() => onFilterChange(f.id)}
          >
            <span className={`type-dot ${f.dotClass}`} />
            {f.label}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">ST</div>
          <div>
            <div className="user-name">Student</div>
            <div className="user-role">student@campus.edu</div>
          </div>
        </div>
        <button className="signout-btn">
          <Icon path={Icons.logout} size={13} />
          Sign out
        </button>
      </div>
    </nav>
  );
}

/* ─── STATS ROW ──────────────────────────────────────────────── */
function StatsRow({ notifications }) {
  const total       = notifications.length;
  const unread      = notifications.filter(n => !n.is_read).length;
  const placements  = notifications.filter(n => n.type === "placement").length;
  const events      = notifications.filter(n => n.type === "event").length;

  return (
    <div className="stats-row">
      <div className="stat-cell">
        <span className="stat-label">Total</span>
        <span className="stat-value">{total}</span>
        <span className="stat-sub">Notifications</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Unread</span>
        <span className="stat-value stat-accent">{unread}</span>
        <span className="stat-sub">Pending review</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Placements</span>
        <span className="stat-value">{placements}</span>
        <span className="stat-sub">Active drives</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Events</span>
        <span className="stat-value stat-amber">{events}</span>
        <span className="stat-sub">Upcoming</span>
      </div>
    </div>
  );
}

/* ─── NOTIFICATION ROW ───────────────────────────────────────── */
function NotifRow({ notification, rank }) {
  const isUnread = notification.is_read === false;
  const type = notification.type?.toLowerCase();
  return (
    <div className={`notif-row ${type === "placement" && isUnread ? "high-priority" : ""}`}>
      {rank !== undefined && (
        <div className="rank-col">{rank}</div>
      )}
      <div className="notif-message-col">
        <span className={`status-dot ${isUnread ? "unread" : "read"}`} />
        <div className="notif-text">
          <div className={`notif-title ${isUnread ? "" : "read"}`}>
            {notification.title}
          </div>
          <div className="notif-desc">
            {truncate(notification.message, 88)}
          </div>
        </div>
      </div>
      <div>
        <TypeBadge type={type} />
      </div>
      <div className="notif-time">
        {timeAgo(notification.created_at || notification.createdAt)}
      </div>
      {rank === undefined && (
        <div className="priority-indicator">
          <span className="priority-dot" />
        </div>
      )}
    </div>
  );
}

/* ─── ALL NOTIFICATIONS PAGE ─────────────────────────────────── */
function AllNotificationsPage({ filter, setFilter }) {
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [notifications, setNotifs]  = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotal]    = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const debounce = useRef(null);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
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
  }, [page, limit, filter]);

  // Client-side search filter
  const visible = notifications.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">All Notifications</h1>
          <p className="page-subtitle">
            {totalRecords} announcement{totalRecords !== 1 ? "s" : ""}
            {filter !== "all" ? ` · filtered by ${filter}` : ""} · updated just now
          </p>
        </div>
        <div className="header-controls">
          {/* Search */}
          <div className="search-wrap">
            <Icon path={Icons.search} size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search notifications…"
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter dropdown */}
          <select
            className="filter-select"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="placement">Placement</option>
            <option value="result">Result</option>
            <option value="event">Event</option>
          </select>

          {/* Refresh icon */}
          <button className="icon-btn" title="Refresh" onClick={() => setPage(p => p)}>
            <Icon path={Icons.refresh} size={13} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow notifications={notifications} />

      {/* Table */}
      <div className="notif-table-wrap">
        <div className="table-head">
          <span className="th">Message</span>
          <span className="th">Type</span>
          <span className="th">Time</span>
          <span className="th" />
        </div>

        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <span className="state-sub">Loading notifications…</span>
          </div>
        )}

        {!loading && error && (
          <div className="state-container">
            <div className="alert error" style={{ maxWidth: 420 }}>
              <Icon path={Icons.alert} size={15} className="alert-icon" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="state-container">
            <Icon path={Icons.inbox} size={36} style={{ color: "var(--text-disabled)" }} />
            <span className="state-title">No notifications found</span>
            <span className="state-sub">
              {search ? `No results for "${search}"` : "Nothing here yet."}
            </span>
          </div>
        )}

        {!loading && !error && visible.map(n => (
          <NotifRow key={n.id || n.created_at} notification={n} />
        ))}

        {/* Pagination */}
        {!loading && !error && totalPages > 0 && (
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
              {pages.slice(Math.max(0, page - 3), page + 2).map(p => (
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
              {[5, 10, 20, 50].map(v => (
                <option key={v} value={v}>{v} per page</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── PRIORITY NOTIFICATIONS PAGE ───────────────────────────── */
function PriorityPage() {
  const [nLimit, setNLimit]         = useState(10);
  const [notifications, setNotifs]  = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNotifications(1, 100, "all")
      .then(res => {
        const raw = res?.data?.notifications || res?.notifications || [];
        setNotifs(sortNotifications(raw));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const topN = notifications.slice(0, Math.max(1, Number(nLimit) || 10));

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Priority Alerts</h1>
          <p className="page-subtitle">
            Ranked by criticality — Placement › Result › Event
          </p>
        </div>
        <div className="header-controls">
          <div className="n-limit-wrap">
            <span className="n-limit-label">Show top</span>
            <input
              type="number"
              min={1}
              max={100}
              className="n-limit-input"
              value={nLimit}
              onChange={e => setNLimit(e.target.value)}
            />
            <span className="n-limit-label">alerts</span>
          </div>
        </div>
      </div>

      <div className="notif-table-wrap priority-table">
        <div className="table-head">
          <span className="th">#</span>
          <span className="th">Message</span>
          <span className="th">Type</span>
          <span className="th">Time</span>
        </div>

        {loading && (
          <div className="state-container">
            <div className="spinner" />
            <span className="state-sub">Loading priority alerts…</span>
          </div>
        )}

        {!loading && error && (
          <div className="state-container">
            <div className="alert error" style={{ maxWidth: 420 }}>
              <Icon path={Icons.alert} size={15} className="alert-icon" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && topN.length === 0 && (
          <div className="state-container">
            <Icon path={Icons.star} size={36} style={{ color: "var(--text-disabled)" }} />
            <span className="state-title">No priority alerts</span>
          </div>
        )}

        {!loading && !error && topN.map((n, i) => (
          <NotifRow key={n.id || n.created_at} notification={n} rank={i + 1} />
        ))}
      </div>
    </>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────── */
export default function App() {
  const [activePage,   setActivePage]   = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // Sync sidebar type filter → page filter
  const handleFilterChange = (f) => {
    setActiveFilter(f);
    setActivePage("all"); // always switch to all-notifs when filtering
  };

  return (
    <>
      <Background />
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        <main className="main-content">
          {activePage === "all" && (
            <AllNotificationsPage
              filter={activeFilter}
              setFilter={setActiveFilter}
            />
          )}
          {activePage === "priority" && (
            <PriorityPage />
          )}
        </main>
      </div>
    </>
  );
}