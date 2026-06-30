const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "placement",
    title: "Google - Software Engineer FTE Hiring",
    message: "Google has opened applications for Software Engineer roles. Eligible branches: CSE, ISE, ECE. Package: 32 LPA. Deadline to apply is tonight.",
    created_at: "2026-06-30T10:00:00Z",
    is_read: false,
    payload: { salary_package: "32 LPA", eligible_branches: "CSE, ISE, ECE", deadline: "Tonight" }
  },
  {
    id: "2",
    type: "result",
    title: "Microsoft Recruitments - Final Selects",
    message: "The final list of selected students for Microsoft FTE roles has been released. 12 students selected. Click to view results.",
    created_at: "2026-06-29T18:30:00Z",
    is_read: false,
    payload: { selected_count: "12", company: "Microsoft" }
  },
  {
    id: "3",
    type: "event",
    title: "Annual Tech Fest - Hackathon 2026",
    message: "Register for the 24-hour campus hackathon. Cash prizes up to 1.5 Lakhs. Food and merchandise will be provided.",
    created_at: "2026-06-28T09:15:00Z",
    is_read: true,
    payload: { venue: "Main Auditorium", duration: "24 Hours", prize_pool: "1.5 Lakhs" }
  },
  {
    id: "4",
    type: "placement",
    title: "Uber - Internship Drive for 3rd Year",
    message: "Uber is hiring Summer Interns. CGPA criteria: 8.5+. Test schedule will be shared soon.",
    created_at: "2026-06-30T12:00:00Z",
    is_read: false,
    payload: { stipend: "1.2 LPM", cgpa_cutoff: "8.5" }
  },
  {
    id: "5",
    type: "result",
    title: "Amazon Selects - SDE Internships",
    message: "Amazon has published results for the online assessment. 45 students shortlisted for interviews.",
    created_at: "2026-06-29T14:00:00Z",
    is_read: true,
    payload: { shortlisted_students: "45", role: "SDE Intern" }
  },
  {
    id: "6",
    type: "event",
    title: "Resume Building Seminar by Industry Experts",
    message: "Join us in the seminar hall for an interactive workshop on crafting a standout resume for product companies.",
    created_at: "2026-06-27T11:00:00Z",
    is_read: true,
    payload: { speaker: "Siddharth (Staff Eng, Netflix)", venue: "Seminar Hall 2" }
  },
  {
    id: "7",
    type: "placement",
    title: "Adobe Systems - Product Intern Selection",
    message: "Adobe online challenge starts tomorrow at 10 AM on HackerRank. Logins will be shared via registered mail.",
    created_at: "2026-06-30T06:00:00Z",
    is_read: false,
    payload: { portal: "HackerRank", test_duration: "120 mins" }
  },
  {
    id: "8",
    type: "result",
    title: "Goldman Sachs - OA Shortlist",
    message: "Results of Goldman Sachs Online Assessment are out. 30 students are moving to interview rounds.",
    created_at: "2026-06-28T16:00:00Z",
    is_read: false,
    payload: { company: "Goldman Sachs", candidates_count: "30" }
  },
  {
    id: "9",
    type: "event",
    title: "Expert Talk on Generative AI and LLMs",
    message: "Professor Radhakrishnan will present recent trends in model optimization and training techniques.",
    created_at: "2026-06-26T08:00:00Z",
    is_read: true,
    payload: { speaker: "Dr. Radhakrishnan", time: "2:00 PM" }
  },
  {
    id: "10",
    type: "placement",
    title: "J.P. Morgan - Software Engineer Program",
    message: "J.P. Morgan Chase & Co. applications are open. CGPA: 7.0+ eligible.",
    created_at: "2026-06-29T09:00:00Z",
    is_read: true,
    payload: { role: "Software Engineer", compensation: "19.7 LPA" }
  },
  {
    id: "11",
    type: "placement",
    title: "Salesforce - MTS Hiring Drive",
    message: "Salesforce applications are open for CSE/ISE students. Package: 36 LPA. Make sure to update your profile on the portal.",
    created_at: "2026-06-25T15:00:00Z",
    is_read: true,
    payload: { package: "36 LPA", portal: "Salesforce Jobs" }
  },
  {
    id: "12",
    type: "result",
    title: "Directi Selects - Final Results",
    message: "Directi final selections are out. Congratulations to the 3 selected students!",
    created_at: "2026-06-24T18:00:00Z",
    is_read: true,
    payload: { selected: "3 students" }
  },
  {
    id: "13",
    type: "event",
    title: "Mock Interview Series by Alumni",
    message: "Register for mock system design and coding interviews conducted by seniors working at Meta and Google.",
    created_at: "2026-06-23T10:00:00Z",
    is_read: false,
    payload: { platform: "Zoom", total_slots: "50" }
  },
  {
    id: "14",
    type: "placement",
    title: "Intel - Hardware Engineer Associate",
    message: "Intel is hiring for digital design roles. Open to EEE and ECE students. CGPA: 7.5+.",
    created_at: "2026-06-22T09:00:00Z",
    is_read: true,
    payload: { eligible_branches: "ECE, EEE", cutoff: "7.5 CGPA" }
  },
  {
    id: "15",
    type: "result",
    title: "NVIDIA - Hardware Intern Shortlist",
    message: "NVIDIA has declared the shortlist for interview rounds. Check the spreadsheet attached.",
    created_at: "2026-06-21T16:45:00Z",
    is_read: true,
    payload: { shortlisted: "8 students" }
  },
  {
    id: "16",
    type: "event",
    title: "Alumni Meet 2026 - Registration Open",
    message: "Connect with notable alumni from top tech conglomerates. Panel discussions on career growth.",
    created_at: "2026-06-20T14:00:00Z",
    is_read: true,
    payload: { venue: "Auditorium 2", date: "July 5, 2026" }
  },
  {
    id: "17",
    type: "placement",
    title: "Cisco Systems - Network Engineer Intern",
    message: "Cisco is hiring interns for networking and security domains. Online test next Monday.",
    created_at: "2026-06-19T11:00:00Z",
    is_read: true,
    payload: { package: "15 LPA", role: "Network Engineer Intern" }
  },
  {
    id: "18",
    type: "result",
    title: "Morgan Stanley - Interview Results",
    message: "Morgan Stanley has announced final selects. 5 students selected. Check portal details.",
    created_at: "2026-06-18T17:00:00Z",
    is_read: false,
    payload: { selects: "5" }
  },
  {
    id: "19",
    type: "event",
    title: "Cyber Security Hackathon",
    message: "Capture the Flag (CTF) event organized by the Cybersecurity Club. Exciting prizes to win.",
    created_at: "2026-06-17T12:00:00Z",
    is_read: true,
    payload: { duration: "12 hours", registration: "Free" }
  },
  {
    id: "20",
    type: "placement",
    title: "Oracle - Cloud Associate Hiring",
    message: "Oracle Applications are open on the portal. Deadline to apply is July 1st.",
    created_at: "2026-06-16T10:00:00Z",
    is_read: true,
    payload: { role: "Cloud Application Developer", salary: "18 LPA" }
  },
  {
    id: "21",
    type: "result",
    title: "Qualcomm - Intern Selection List",
    message: "Qualcomm has announced the selected candidates for the hardware internship roles. 6 selected.",
    created_at: "2026-06-15T15:30:00Z",
    is_read: true,
    payload: { selects: "6" }
  },
  {
    id: "22",
    type: "event",
    title: "Startup Incubation Pitch Competition",
    message: "Present your startup ideas to venture capitalists and get funding up to 10 Lakhs.",
    created_at: "2026-06-14T09:00:00Z",
    is_read: true,
    payload: { venue: "Incubation Center", prize: "Funding Opportunity" }
  }
];

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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await logToMiddleware("API_CALL_FETCH_NOTIFICATIONS_SUCCESS", "SUCCESS", {
      total_records: data?.data?.pagination?.total_records || 0,
      count: data?.data?.notifications?.length || 0
    });
    return data;
  } catch (error) {
    await logToMiddleware("API_CALL_FETCH_NOTIFICATIONS_FAILURE_FALLBACK", "WARNING", {
      original_error: error.message,
      message: "API endpoint returned 404 or connection refused. Falling back to local mock database."
    });

    // Client-side fallback dataset calculation
    let filtered = [...MOCK_NOTIFICATIONS];
    if (notificationType && notificationType.toLowerCase() !== "all") {
      filtered = filtered.filter(n => n.type.toLowerCase() === notificationType.toLowerCase());
    }

    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: {
        notifications: paginatedItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total_records: filtered.length,
          total_pages: Math.ceil(filtered.length / limit)
        }
      }
    };
  }
}
