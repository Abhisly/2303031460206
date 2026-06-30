import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import { getNotificationPriority } from "../utils/priority";

export function NotificationCard({ notification }) {
  const { title, message, type, created_at, createdAt, is_read, isRead, payload } = notification;

  const dateStr = new Date(created_at || createdAt).toLocaleString();
  const priority = getNotificationPriority(type);

  const getIcon = () => {
    switch (type?.toLowerCase()) {
      case "placement":
        return <SchoolIcon sx={{ color: "#1976d2" }} />;
      case "result":
        return <AssignmentIcon sx={{ color: "#2e7d32" }} />;
      case "event":
        return <EventIcon sx={{ color: "#ed6c02" }} />;
      default:
        return <SchoolIcon />;
    }
  };

  const getPriorityColor = (p) => {
    if (p === 3) return "error";
    if (p === 2) return "warning";
    return "info";
  };

  const getPriorityLabel = (p) => {
    if (p === 3) return "High Priority";
    if (p === 2) return "Medium Priority";
    return "Low Priority";
  };

  const isUnread = is_read === false || isRead === false;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderLeft: isUnread ? "5px solid #1976d2" : "1px solid #e0e0e0",
        backgroundColor: isUnread ? "#f4faff" : "#fff",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.05)"
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {getIcon()}
            <Typography variant="subtitle1" fontWeight={700}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip 
              label={type?.toUpperCase()} 
              size="small" 
              variant="outlined"
              color={type?.toLowerCase() === "placement" ? "primary" : type?.toLowerCase() === "result" ? "success" : "warning"}
            />
            <Chip 
              label={getPriorityLabel(priority)} 
              size="small" 
              color={getPriorityColor(priority)} 
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {message}
        </Typography>

        {payload && Object.keys(payload).length > 0 && (
          <Box 
            sx={{ 
              p: 1.5, 
              backgroundColor: "#f5f5f5", 
              borderRadius: 1, 
              mb: 2,
              fontSize: "0.85rem"
            }}
          >
            {Object.entries(payload).map(([key, value]) => (
              <Box key={key} sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ textTransform: "capitalize" }}>
                  {key.replace(/_/g, " ")}:
                </Typography>
                <Typography variant="caption">{String(value)}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {dateStr}
          </Typography>
          {isUnread && (
            <Chip label="Unread" size="small" color="primary" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
