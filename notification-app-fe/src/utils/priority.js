export const PRIORITY_MAP = {
  placement: 3,
  result: 2,
  event: 1
};

export function getNotificationPriority(type) {
  if (!type) return 0;
  return PRIORITY_MAP[type.toLowerCase()] || 0;
}

export function sortNotifications(notifications) {
  return [...notifications].sort((a, b) => {
    const priorityA = getNotificationPriority(a.type);
    const priorityB = getNotificationPriority(b.type);

    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    const dateA = new Date(a.created_at || a.createdAt || 0);
    const dateB = new Date(b.created_at || b.createdAt || 0);
    return dateB - dateA;
  });
}
