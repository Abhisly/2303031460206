import { useState, useEffect } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  TextField
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { logToMiddleware } from "../api/notifications";

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Page 1 (All Notifications) states
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Page 2 (Priority Notifications) states
  const [nLimit, setNLimit] = useState(10);

  // Fetching data for Page 1 (All Notifications)
  const {
    notifications: allNotifications,
    totalPages: allTotalPages,
    loading: allLoading,
    error: allError
  } = useNotifications(page, filter, 20);

  // Fetching data for Page 2 (Priority Notifications)
  // We fetch a larger pool (e.g. 100 notifications) to make sure we sort and filter on a larger sample, then we slice to N.
  const {
    notifications: priorityPool,
    loading: priorityLoading,
    error: priorityError
  } = useNotifications(1, "All", 100);

  // Compute actual top N notifications from the sorted pool
  const priorityNotifications = priorityPool.slice(0, Math.max(1, nLimit));

  // Compute unread count for Page 1 notifications
  const unreadCount = allNotifications.filter(n => n.is_read === false || n.isRead === false).length;

  // Log page load whenever the active tab changes
  useEffect(() => {
    const pageName = activeTab === 0 ? "ALL_NOTIFICATIONS_PAGE" : "PRIORITY_NOTIFICATIONS_PAGE";
    logToMiddleware("PAGE_LOAD", "SUCCESS", { page: pageName });
  }, [activeTab]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  const handleNLimitChange = (event) => {
    const val = parseInt(event.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setNLimit(val);
    } else if (event.target.value === "") {
      setNLimit("");
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Page Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 32, color: "primary.main" }} />
        </Badge>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}>
          Campus Hub
        </Typography>
      </Stack>

      {/* Tabs Navigation (Page 1 vs Page 2) */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="notification system sections">
          <Tab label="All Notifications" id="tab-all-notifications" />
          <Tab label="Priority Alerts" id="tab-priority-alerts" />
        </Tabs>
      </Box>

      {/* Page 1: All Notifications */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              All Announcements
            </Typography>
            <NotificationFilter value={filter} onChange={handleFilterChange} />
          </Box>

          {allLoading && (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          )}

          {!allLoading && allError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load announcements: {allError}
            </Alert>
          )}

          {!allLoading && !allError && allNotifications.length === 0 && (
            <Paper variant="outlined" sx={{ py: 8, px: 3, textAlign: "center", backgroundColor: "#fafafa" }}>
              <NotificationsIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                No notifications found.
              </Typography>
              <Typography variant="body2" color="text.disabled">
                There are no alerts matching the selected category.
              </Typography>
            </Paper>
          )}

          {!allLoading && !allError && allNotifications.length > 0 && (
            <Stack spacing={2}>
              {allNotifications.map((n) => (
                <NotificationCard key={n.id || n.created_at} notification={n} />
              ))}
            </Stack>
          )}

          {!allLoading && !allError && allTotalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={allTotalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Page 2: Priority Notifications */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                High-Priority Alerts Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Announcements ranked by critical category: Placement &gt; Result &gt; Event
              </Typography>
            </Box>
            <TextField
              label="Show Top N Alerts"
              type="number"
              size="small"
              value={nLimit}
              onChange={handleNLimitChange}
              inputProps={{ min: 1, max: 100 }}
              sx={{ width: 150 }}
            />
          </Box>

          {priorityLoading && (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          )}

          {!priorityLoading && priorityError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load priority alerts: {priorityError}
            </Alert>
          )}

          {!priorityLoading && !priorityError && priorityNotifications.length === 0 && (
            <Paper variant="outlined" sx={{ py: 8, px: 3, textAlign: "center", backgroundColor: "#fafafa" }}>
              <StarIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="subtitle1" color="text.secondary" fontWeight={500}>
                No priority announcements.
              </Typography>
            </Paper>
          )}

          {!priorityLoading && !priorityError && priorityNotifications.length > 0 && (
            <Stack spacing={2}>
              {priorityNotifications.map((n) => (
                <NotificationCard key={n.id || n.created_at} notification={n} />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
