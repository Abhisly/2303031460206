import { useState } from "react";
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
  Paper
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { 
    notifications, 
    topNotifications, 
    totalPages, 
    loading, 
    error 
  } = useNotifications(page, filter);

  // Compute unread count from current page
  const unreadCount = notifications.filter(n => n.is_read === false || n.isRead === false).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 32 }} />
        </Badge>
        <Typography variant="h4" fontWeight={800}>
          Campus Notification Hub
        </Typography>
      </Stack>

      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={4}>
        {/* Main Feed Section */}
        <Grid item xs={12} md={8}>
          <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Notification Feed
            </Typography>
            <NotificationFilter value={filter} onChange={handleFilterChange} />
          </Box>

          {loading && (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load notifications: {error}
            </Alert>
          )}

          {!loading && !error && notifications.length === 0 && (
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

          {!loading && !error && notifications.length > 0 && (
            <Stack spacing={2}>
              {notifications.map((n) => (
                <NotificationCard key={n.id} notification={n} />
              ))}
            </Stack>
          )}

          {!loading && !error && totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </Grid>

        {/* Sidebar Highlight Section */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, backgroundColor: "#fafafa", height: "100%" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <StarIcon sx={{ color: "#dfb200" }} />
              <Typography variant="h6" fontWeight={700}>
                Top 10 High Priority
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {loading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={30} />
              </Box>
            )}

            {!loading && !error && topNotifications.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                No active announcements.
              </Typography>
            )}

            {!loading && !error && topNotifications.length > 0 && (
              <Stack spacing={1.5}>
                {topNotifications.map((n) => (
                  <Paper 
                    key={n.id} 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      borderColor: n.type?.toLowerCase() === "placement" ? "#f5c2c2" : n.type?.toLowerCase() === "result" ? "#c8e6c9" : "#e0e0e0",
                      backgroundColor: n.type?.toLowerCase() === "placement" ? "#fffefe" : n.type?.toLowerCase() === "result" ? "#fbfdfb" : "#ffffff"
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                        {n.type}
                      </Typography>
                      <Typography variant="caption" color="error.main" fontWeight={700}>
                        {n.type?.toLowerCase() === "placement" ? "P3" : n.type?.toLowerCase() === "result" ? "P2" : "P1"}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {n.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {n.message}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
