export async function logToMiddleware(event, status, details = {}) {
  try {
    const token = localStorage.getItem("token");
    await fetch("/evaluation-service/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        event,
        status,
        details,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    // Silently ignore logging failures
  }
}

export async function fetchNotifications(page = 1, limit = 20, notificationType = null) {
  const token = localStorage.getItem("token");
  const headers = {
    "Accept": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  let url = `/evaluation-service/notifications?page=${page}&limit=${limit}`;
  if (notificationType && notificationType.toLowerCase() !== "all") {
    url += `&notification_type=${notificationType.toLowerCase()}`;
  }

  await logToMiddleware("API_CALL_FETCH_NOTIFICATIONS", "PENDING", { page, limit, notificationType });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errDetails = {
        status: response.status,
        statusText: response.statusText,
        url,
        body: errorText
      };
      await logToMiddleware("API_CALL_FETCH_NOTIFICATIONS_FAILURE", "FAILURE", errDetails);
      throw new Error(`HTTP Error ${response.status}: ${response.statusText || errorText}`);
    }

    const data = await response.json();
    await logToMiddleware("API_CALL_FETCH_NOTIFICATIONS_SUCCESS", "SUCCESS", {
      total_records: data?.data?.pagination?.total_records || 0,
      count: data?.data?.notifications?.length || 0
    });
    return data;
  } catch (error) {
    await logToMiddleware("API_CALL_FETCH_NOTIFICATIONS_EXCEPTION", "EXCEPTION", {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}
