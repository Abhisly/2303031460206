import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { sortNotifications } from "../utils/priority";

export function useNotifications(page = 1, filter = "All", limit = 20) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNotifications(page, limit, filter);
        if (!active) return;

        const rawNotifications = res?.data?.notifications || res?.notifications || [];
        const pagination = res?.data?.pagination || res?.pagination || {};

        const sorted = sortNotifications(rawNotifications);

        setNotifications(sorted);
        setTotal(pagination.total_records || sorted.length);
        setTotalPages(pagination.total_pages || 1);
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to fetch notifications");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [page, filter, limit]);

  return {
    notifications,
    total,
    totalPages,
    loading,
    error
  };
}
