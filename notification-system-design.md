# Notification System Design

# Stage 1

This stage defines a RESTful API specification for the Campus Notification System. The system manages notifications categorized as **Placement**, **Result**, and **Event** for authenticated campus users.

---

## Authentication and Global Standards
*   **Protocol:** HTTPS
*   **Authentication Scheme:** Bearer Token (JWT) sent via HTTP Authorization Header.
    ```http
    Authorization: Bearer <jwt_access_token>
    ```
*   **Request/Response Format:** JSON (`Content-Type: application/json`, `Accept: application/json`)
*   **Naming Conventions:** API paths use `kebab-case`, query parameters use `snake_case`, and JSON keys use `snake_case`.

---

## Endpoint Specification

### 1. Get All Notifications
Retrieves a paginated list of notifications for the authenticated user, supporting optional filters for notification type, read status, and search query.

*   **Endpoint:** `/api/v1/notifications`
*   **HTTP Method:** `GET`
*   **Purpose:** Fetch the user's notification feed.
*   **Authentication:** Required (Bearer Token)
*   **Headers:**
    | Header | Type | Value / Description | Required |
    | :--- | :--- | :--- | :--- |
    | `Authorization` | String | `Bearer <token>` | Yes |
    | `Accept` | String | `application/json` | Yes |
*   **Query Parameters:**
    | Parameter | Type | Default | Description | Required |
    | :--- | :--- | :--- | :--- | :--- |
    | `page` | Integer | `1` | Page number for pagination | No |
    | `limit` | Integer | `20` | Number of records per page (Max: 100) | No |
    | `type` | String | `null` | Filter by type: `placement`, `result`, or `event` | No |
    | `is_read` | Boolean | `null` | Filter by read status: `true` or `false` | No |
    | `q` | String | `null` | Full-text search term matching title or message | No |
*   **Path Parameters:** None
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "notifications": [
          {
            "id": "e305e7a9-11c5-4ad9-bf0c-2d02c7fb3870",
            "type": "placement",
            "title": "Google Placement Drive - Software Engineer 2026",
            "message": "Applications are now open for the Software Engineer role at Google. The application deadline is July 15, 2026.",
            "payload": {
              "job_id": "job_goog_001",
              "salary_package": "INR 3,200,000",
              "deadline": "2026-07-15T23:59:59Z",
              "apply_link": "https://campus.evaluation/jobs/goog-001"
            },
            "is_read": false,
            "read_at": null,
            "created_at": "2026-06-30T13:47:52Z"
          },
          {
            "id": "8b04c816-cb04-4d44-bfe6-0c1961ee72b1",
            "type": "result",
            "title": "Amazon Interview Round 1 Results",
            "message": "Congratulations! You have cleared Round 1 of the Amazon placement process. Prepare for Round 2 schedule details inside.",
            "payload": {
              "result_id": "res_amaz_441",
              "next_round": "Technical Panel Interview",
              "next_round_date": "2026-07-02T10:00:00Z"
            },
            "is_read": true,
            "read_at": "2026-06-30T10:15:30Z",
            "created_at": "2026-06-30T09:00:00Z"
          }
        ],
        "pagination": {
          "total_records": 48,
          "current_page": 1,
          "total_pages": 3,
          "limit": 20,
          "has_next": true,
          "has_previous": false
        }
      }
    }
    ```
*   **Error Response (400 Bad Request):**
    ```json
    {
      "success": false,
      "error": {
        "code": "BAD_REQUEST",
        "message": "Invalid query parameters.",
        "details": {
          "type": "Must be one of: placement, result, event",
          "limit": "Must be a positive integer less than or equal to 100"
        }
      }
    }
    ```
*   **Error Response (401 Unauthorized):**
    ```json
    {
      "success": false,
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Authentication token is missing, expired, or invalid."
      }
    }
    ```
*   **Status Codes:**
    *   `200 OK` - Request completed successfully.
    *   `400 Bad Request` - Invalid query parameters validation failed.
    *   `401 Unauthorized` - Token missing or invalid.
    *   `500 Internal Server Error` - Database or server failure.

---

### 2. Get Notification by ID
Retrieves details of a specific notification matching the path parameters.

*   **Endpoint:** `/api/v1/notifications/{id}`
*   **HTTP Method:** `GET`
*   **Purpose:** Fetch detail overview of a single notification.
*   **Authentication:** Required (Bearer Token)
*   **Headers:**
    | Header | Type | Value / Description | Required |
    | :--- | :--- | :--- | :--- |
    | `Authorization` | String | `Bearer <token>` | Yes |
    | `Accept` | String | `application/json` | Yes |
*   **Query Parameters:** None
*   **Path Parameters:**
    | Parameter | Type | Description | Required |
    | :--- | :--- | :--- | :--- |
    | `id` | String (UUID) | Unique identifier of the notification | Yes |
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "e305e7a9-11c5-4ad9-bf0c-2d02c7fb3870",
        "type": "event",
        "title": "Resume Building Workshop",
        "message": "Reminder: The workshop starts at 4:00 PM today in Seminar Hall A.",
        "payload": {
          "event_id": "evt_workshop_101",
          "speaker": "Dr. Sarah Jenkins",
          "venue": "Seminar Hall A",
          "scheduled_time": "2026-06-30T16:00:00Z"
        },
        "is_read": false,
        "read_at": null,
        "created_at": "2026-06-30T12:00:00Z"
      }
    }
    ```
*   **Error Response (404 Not Found):**
    ```json
    {
      "success": false,
      "error": {
        "code": "NOT_FOUND",
        "message": "Notification with the specified ID was not found or access is forbidden."
      }
    }
    ```
*   **Status Codes:**
    *   `200 OK` - Successfully fetched the notification details.
    *   `400 Bad Request` - Invalid ID path parameter format.
    *   `401 Unauthorized` - Token missing or invalid.
    *   `404 Not Found` - Notification not found for the current user.
    *   `500 Internal Server Error` - Database or server failure.

---

### 3. Get Unread Notifications
Retrieves a paginated list of all unread notifications for the authenticated user.

*   **Endpoint:** `/api/v1/notifications/unread`
*   **HTTP Method:** `GET`
*   **Purpose:** Fetch unread notifications for badges/counters.
*   **Authentication:** Required (Bearer Token)
*   **Headers:**
    | Header | Type | Value / Description | Required |
    | :--- | :--- | :--- | :--- |
    | `Authorization` | String | `Bearer <token>` | Yes |
    | `Accept` | String | `application/json` | Yes |
*   **Query Parameters:**
    | Parameter | Type | Default | Description | Required |
    | :--- | :--- | :--- | :--- | :--- |
    | `page` | Integer | `1` | Page number for pagination | No |
    | `limit` | Integer | `20` | Number of records per page (Max: 100) | No |
    | `type` | String | `null` | Filter by type: `placement`, `result`, or `event` | No |
*   **Path Parameters:** None
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "notifications": [
          {
            "id": "e305e7a9-11c5-4ad9-bf0c-2d02c7fb3870",
            "type": "placement",
            "title": "Google Placement Drive - Software Engineer 2026",
            "message": "Applications are now open for the Software Engineer role at Google. The application deadline is July 15, 2026.",
            "payload": {
              "job_id": "job_goog_001",
              "salary_package": "INR 3,200,000",
              "deadline": "2026-07-15T23:59:59Z",
              "apply_link": "https://campus.evaluation/jobs/goog-001"
            },
            "is_read": false,
            "read_at": null,
            "created_at": "2026-06-30T13:47:52Z"
          }
        ],
        "pagination": {
          "total_records": 1,
          "current_page": 1,
          "total_pages": 1,
          "limit": 20,
          "has_next": false,
          "has_previous": false
        }
      }
    }
    ```
*   **Status Codes:**
    *   `200 OK` - Successfully fetched unread list.
    *   `401 Unauthorized` - Token missing or invalid.
    *   `500 Internal Server Error` - Database or server failure.

---

### 4. Mark Notification as Read
Updates the status of a specific notification for the user to read.

*   **Endpoint:** `/api/v1/notifications/{id}/read`
*   **HTTP Method:** `PATCH`
*   **Purpose:** Mark one notification as read.
*   **Authentication:** Required (Bearer Token)
*   **Headers:**
    | Header | Type | Value / Description | Required |
    | :--- | :--- | :--- | :--- |
    | `Authorization` | String | `Bearer <token>` | Yes |
    | `Content-Type` | String | `application/json` | Yes |
*   **Query Parameters:** None
*   **Path Parameters:**
    | Parameter | Type | Description | Required |
    | :--- | :--- | :--- | :--- |
    | `id` | String (UUID) | Notification ID to update | Yes |
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Notification marked as read successfully.",
      "data": {
        "id": "e305e7a9-11c5-4ad9-bf0c-2d02c7fb3870",
        "is_read": true,
        "read_at": "2026-06-30T13:48:10Z"
      }
    }
    ```
*   **Error Response (404 Not Found):**
    ```json
    {
      "success": false,
      "error": {
        "code": "NOT_FOUND",
        "message": "Notification not found or access denied."
      }
    }
    ```
*   **Status Codes:**
    *   `200 OK` - Status changed.
    *   `401 Unauthorized` - Authentication failed.
    *   `404 Not Found` - Notification ID does not match records.
    *   `500 Internal Server Error` - Database failure.

---

### 5. Mark All Notifications as Read
Batch updates all unread notifications to read status. Filters optionally limit updates to a specific type.

*   **Endpoint:** `/api/v1/notifications/read-all`
*   **HTTP Method:** `POST`
*   **Purpose:** Bulk mark notifications as read.
*   **Authentication:** Required (Bearer Token)
*   **Headers:**
    | Header | Type | Value / Description | Required |
    | :--- | :--- | :--- | :--- |
    | `Authorization` | String | `Bearer <token>` | Yes |
    | `Content-Type` | String | `application/json` | Yes |
*   **Query Parameters:** None
*   **Path Parameters:** None
*   **Request Body:**
    *   *Option A: Update all notification types*
        ```json
        {}
        ```
    *   *Option B: Update only specific notification type*
        ```json
        {
          "type": "placement"
        }
        ```
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "All matching notifications marked as read.",
      "data": {
        "modified_count": 8
      }
    }
    ```
*   **Error Response (400 Bad Request):**
    ```json
    {
      "success": false,
      "error": {
        "code": "BAD_REQUEST",
        "message": "Invalid request body content.",
        "details": {
          "type": "Must be one of: placement, result, event"
        }
      }
    }
    ```
*   **Status Codes:**
    *   `200 OK` - Bulk update succeeded.
    *   `400 Bad Request` - Invalid request body properties.
    *   `401 Unauthorized` - Token missing or invalid.
    *   `500 Internal Server Error` - Database transaction failed.

---

### 6. Delete Notification
Performs a logical soft-delete of a specific notification for the user.

*   **Endpoint:** `/api/v1/notifications/{id}`
*   **HTTP Method:** `DELETE`
*   **Purpose:** Clear a notification from the user's view.
*   **Authentication:** Required (Bearer Token)
*   **Headers:**
    | Header | Type | Value / Description | Required |
    | :--- | :--- | :--- | :--- |
    | `Authorization` | String | `Bearer <token>` | Yes |
*   **Query Parameters:** None
*   **Path Parameters:**
    | Parameter | Type | Description | Required |
    | :--- | :--- | :--- | :--- |
    | `id` | String (UUID) | Notification ID to delete | Yes |
*   **Request Body:** None
*   **Success Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Notification deleted successfully."
    }
    ```
*   **Error Response (404 Not Found):**
    ```json
    {
      "success": false,
      "error": {
        "code": "NOT_FOUND",
        "message": "Notification was not found or has already been deleted."
      }
    }
    ```
*   **Status Codes:**
    *   `200 OK` - Notification deleted.
    *   `401 Unauthorized` - Authentication failed.
    *   `404 Not Found` - Specified notification ID not found.
    *   `500 Internal Server Error` - Database delete operations failed.

---

# Stage 2

This stage details the database schema design, normalization, indexing strategy, data queries, and architectural considerations for the Campus Notification System.

## Relational Database Selection: PostgreSQL
PostgreSQL is chosen as the relational database engine due to the following architectural advantages:
1.  **Strict ACID Compliance:** Guarantees data integrity for multi-step transaction sequences, such as issuing bulk notifications where records must insert cleanly across target student users.
2.  **Native JSONB Datatype Support:** Allows structured storage of notification payloads (e.g. metadata links, event details) with indexing capabilities, bypassing schema changes when notification details differ.
3.  **Advanced Indexing:** Offers GIN (Generalized Inverted Index) for high-performance text searching, and Partial Indexes to isolate unread messages.
4.  **Partitioning and Scaling Extensions:** Native declarative partitioning facilitates horizontal segmenting by timestamp ranges to scale millions of entries.

---

## Production-Ready Schema

### Entity Relationship & Tables

#### 1. Table: `users`
Tracks system users who send or receive notifications.
*   **Columns & Constraints:**
    | Column | Data Type | Constraints | Default | Description |
    | :--- | :--- | :--- | :--- | :--- |
    | `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique user ID |
    | `email` | VARCHAR(255) | UNIQUE, NOT NULL | None | User email address |
    | `password_hash` | VARCHAR(255) | NOT NULL | None | Encrypted password |
    | `role` | VARCHAR(50) | NOT NULL | None | Must be 'student', 'admin', or 'recruiter' |
    | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Account creation timestamp |
    | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Last updated timestamp |

#### 2. Table: `notifications`
Stores the canonical content payload of generated system notifications.
*   **Columns & Constraints:**
    | Column | Data Type | Constraints | Default | Description |
    | :--- | :--- | :--- | :--- | :--- |
    | `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique notification ID |
    | `type` | VARCHAR(50) | NOT NULL | None | Must be 'placement', 'result', or 'event' |
    | `title` | VARCHAR(255) | NOT NULL | None | Header title |
    | `message` | TEXT | NOT NULL | None | Body text message |
    | `payload` | JSONB | NULLABLE | `NULL` | Structured meta details |
    | `sender_id` | UUID | FOREIGN KEY -> `users(id)` ON DELETE SET NULL | `NULL` | User id of the sender |
    | `created_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Generation timestamp |
    | `updated_at` | TIMESTAMPTZ | NOT NULL | `CURRENT_TIMESTAMP` | Last updated timestamp |

#### 3. Table: `notification_read_statuses`
Maps notifications to recipient users, capturing individual read/deleted states.
*   **Columns & Constraints:**
    | Column | Data Type | Constraints | Default | Description |
    | :--- | :--- | :--- | :--- | :--- |
    | `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique status entry ID |
    | `notification_id` | UUID | FOREIGN KEY -> `notifications(id)` ON DELETE CASCADE | None | Related notification ID |
    | `user_id` | UUID | FOREIGN KEY -> `users(id)` ON DELETE CASCADE | None | Target recipient user ID |
    | `is_read` | BOOLEAN | NOT NULL | `FALSE` | Read status state flag |
    | `read_at` | TIMESTAMPTZ | NULLABLE | `NULL` | Time read status changed |
    | `is_deleted` | BOOLEAN | NOT NULL | `FALSE` | Soft-delete state flag |
    | `deleted_at` | TIMESTAMPTZ | NULLABLE | `NULL` | Timestamp of soft delete |

*   **Unique Constraints:**
    *   `uq_user_notification_mapping`: UNIQUE(`user_id`, `notification_id`)

---

## SQL CREATE TABLE Statements

```sql
-- DDL Script for Campus Notification System

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'recruiter')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('placement', 'result', 'event')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT NULL,
    sender_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_sender FOREIGN KEY (sender_id) 
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE notification_read_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_read_statuses_notification FOREIGN KEY (notification_id) 
        REFERENCES notifications (id) ON DELETE CASCADE,
    CONSTRAINT fk_read_statuses_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_user_notification UNIQUE (user_id, notification_id)
);
```

---

## Indexing Strategy

### 1. DDL Statements for Indexes
```sql
-- Index on foreign keys for JOIN operations
CREATE INDEX idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX idx_read_statuses_notification_id ON notification_read_statuses(notification_id);

-- Standard index for paging ordered results
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Partial index for active unread notification queries
CREATE INDEX idx_read_statuses_unread_active 
ON notification_read_statuses(user_id) 
WHERE is_read = FALSE AND is_deleted = FALSE;

-- GIN (Generalized Inverted Index) for full-text search matching
CREATE INDEX idx_notifications_search_gin 
ON notifications 
USING gin (to_tsvector('english', title || ' ' || message));
```

### 2. Index Justifications
*   `idx_notifications_sender_id` & `idx_read_statuses_notification_id`: Prevents full table scans when joining tables during queries.
*   `idx_notifications_created_at`: Speeds up time-sorted retrieval (`ORDER BY created_at DESC`) for notification feeds.
*   `idx_read_statuses_unread_active`: A partial index optimized for fetching unread messages. It ignores read and deleted records, minimizing storage footprint and query traversal costs.
*   `idx_notifications_search_gin`: Implements high-performance text search across `title` and `message` columns, allowing sub-millisecond keyword filtering.

---

## SQL Queries

### 1. Insert Notification
Inserts notification metadata, then bulk-maps to recipient users (students).
```sql
-- Step 1: Insert content payload
INSERT INTO notifications (type, title, message, payload, sender_id)
VALUES ('placement', 'Google Recruitment Drive', 'Apply now on portal.', '{"job_id": "job_goog_001"}', 'c93a8d16-6548-4a58-8547-2384a8ab9610')
RETURNING id;

-- Step 2: Associate with targeted users
INSERT INTO notification_read_statuses (notification_id, user_id)
SELECT 'notification_uuid_placeholder', id
FROM users
WHERE role = 'student';
```

### 2. Get Notifications (Paginated with search and type filter)
```sql
SELECT 
    n.id, 
    n.type, 
    n.title, 
    n.message, 
    n.payload, 
    n.created_at, 
    r.is_read, 
    r.read_at
FROM notifications n
JOIN notification_read_statuses r ON n.id = r.notification_id
WHERE r.user_id = :user_id 
  AND r.is_deleted = FALSE
  AND (:type::VARCHAR IS NULL OR n.type = :type)
  AND (:search_term::VARCHAR IS NULL OR to_tsvector('english', n.title || ' ' || n.message) @@ plainto_tsquery('english', :search_term))
ORDER BY n.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 3. Get Unread Notifications (Paginated)
```sql
SELECT 
    n.id, 
    n.type, 
    n.title, 
    n.message, 
    n.payload, 
    n.created_at, 
    r.is_read
FROM notifications n
JOIN notification_read_statuses r ON n.id = r.notification_id
WHERE r.user_id = :user_id 
  AND r.is_read = FALSE 
  AND r.is_deleted = FALSE
  AND (:type::VARCHAR IS NULL OR n.type = :type)
ORDER BY n.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 4. Mark Notification Read
```sql
UPDATE notification_read_statuses
SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
WHERE notification_id = :notification_id 
  AND user_id = :user_id 
  AND is_read = FALSE 
  AND is_deleted = FALSE;
```

### 5. Delete Notification (Soft-delete)
```sql
UPDATE notification_read_statuses
SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
WHERE notification_id = :notification_id 
  AND user_id = :user_id;
```

---

## Technical Discussion & Scaling

### Indexing
B-Tree indexes are applied on UUID foreign keys to accelerate JOIN operations. The read-heavy query load of unread status checking is optimized using a PostgreSQL partial index targeting `is_read = FALSE AND is_deleted = FALSE`. This avoids indexing the fast-growing list of read historical notifications. For text-based notification searching, the Generalized Inverted Index (GIN) using `to_tsvector` enables fast keyword queries without utilizing resource-intensive `LIKE` pattern matching.

### Scalability
To handle read-heavy client request traffic, read/write segregation is configured. Write traffic (creating notifications, updates) goes to a primary instance, while read traffic (loading feeds, checking unread counts) is distributed across multiple read replicas. Caching unread counts on a per-user basis in Redis prevents frequent database hits on user dashboard loads.

### Partitioning
As historical notification data scales, the `notification_read_statuses` and `notifications` tables are partitioned using **declarative range partitioning** based on the `created_at` timestamp. Partitions are split on a monthly or quarterly basis (e.g., `notifications_2026_q2`, `notifications_2026_q3`). Older partition tables can be detached or dropped rapidly, keeping the active working set small and fitting within RAM.

### Archiving
An automated cron worker script runs periodically to copy rows older than six months from `notifications` and `notification_read_statuses` to cold storage (e.g., PostgreSQL archive schemas, or compressed formats in Amazon S3 via data pipeline). Once verified, the entries are purged from the primary active tables. This maintains compact database index footprints and optimizes write/vacuum transaction overhead.

### Pagination Strategy
OFFSET pagination degrades in efficiency at scale (`OFFSET 100000 LIMIT 20`) because the database must scan and discard all offset rows. The system implements **Keyset Pagination (Cursor Pagination)**. Feeds are queried using the oldest `created_at` timestamp and `id` from the previous page:
```sql
SELECT ... 
FROM notifications n
JOIN notification_read_statuses r ON n.id = r.notification_id
WHERE r.user_id = :user_id
  AND r.is_deleted = FALSE
  AND (n.created_at, n.id) < (:last_created_at, :last_id)
ORDER BY n.created_at DESC, n.id DESC
LIMIT :limit;
```
This strategy ensures consistent `O(1)` index scan performance across deep list fetches and prevents layout shifts or skipped items when new notifications are concurrently inserted.

### Future Scaling
At very high scales (e.g., notifying all students across multiple campuses), creating millions of read status rows simultaneously blocks primary database input/output pipelines. Dekeying delivery involves writing notifications to a message queue (e.g., Apache Kafka or RabbitMQ) where worker consumers sequentially batch insert read statuses. Real-time client updates are pushed using Server-Sent Events (SSE) or WebSockets managed by a stateless connection manager layer, bypassing direct database connection pool exhaustion.

# Stage 3

## Query Analysis

The target query analyzed is:
```sql
SELECT *
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt ASC;
```

### Logical Correctness Evaluation
*   **Schema Violation:** In the normalized production database schema defined in Stage 2, `studentID` (foreign key referring to `users.id`) and `isRead` columns do not exist directly on the `notifications` table. They reside in the junction table `notification_read_statuses`. This query will fail with column reference errors.
*   **Broadcast Redundancy:** Storing `studentID` and `isRead` directly in the `notifications` table assumes a strict 1:1 relationship between notifications and users. In a campus system where placements and events are broadcast to thousands of students, this configuration duplicates notifications data redundantly for every user, wasting massive storage space.
*   **Select Wildcard:** `SELECT *` retrieves all columns, including heavy metadata fields and payload attributes, adding unnecessary data transfer weight.

### Performance Degradation at Scale
With **500,000 students** and **50 million notifications**:
*   **FTS Bottleneck:** Finding unread notifications for a single student forces the query engine to execute a Full Table Scan (FTS) across 50,000,000 rows.
*   **I/O Stagnation:** The engine reads millions of raw data blocks from disk storage into the buffer pool, saturating physical disk reading capacity.
*   **Sort Bottleneck:** `ORDER BY createdAt ASC` triggers an intensive sorting phase. Sorting 50 million records without index assistance forces PostgreSQL to move sorting operations from RAM memory buffer (`work_mem`) to slow temporary files on disk.

---

## Performance Issues

1.  **SELECT \***
    *   Retrieves heavy columns (like nested JSONB payload metadata).
    *   Increases network transit overhead and memory footprints on the server nodes.
2.  **Full Table Scan**
    *   Sequential scan of 50M rows to check constraints (`studentID = 1042` and `isRead = false`).
    *   Incurs high CPU and memory thrashing.
3.  **Sorting Cost**
    *   O(N log N) sorting overhead applied dynamically.
    *   Without index collation, records are sorted at runtime, slowing response times.
4.  **Missing Indexes**
    *   The absence of indexing on filtering criteria (`studentID`, `isRead`) and sorting columns (`createdAt`) halts optimization strategies.
5.  **Large I/O**
    *   Massive number of random disk reads needed to pull rows from heap tables into memory cache.
6.  **Memory Consumption**
    *   Fills the cache (`shared_buffers`) with cold notification data, evicting active cache entries of other systems.

---

## Computational Complexity (Before Optimization)
*   **Time Complexity:** $O(N \log N)$ where $N$ is the total number of notifications in the table (50 million) due to the sorting operation.
*   **Space Complexity:** $O(N)$ for buffering and performing out-of-core sorting operations on disk temp files.

---

## Query Optimization

### Optimized SQL Query (Using Stage 2 Normalized Schema)
```sql
SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.payload,
    n.created_at
FROM notifications n
JOIN notification_read_statuses r ON n.id = r.notification_id
WHERE r.user_id = :student_id
  AND r.is_read = FALSE
  AND r.is_deleted = FALSE
ORDER BY n.created_at ASC;
```

---

## Indexing Strategy

### Recommended Composite Index
```sql
CREATE INDEX idx_read_statuses_user_unread_opt 
ON notification_read_statuses (user_id) 
INCLUDE (notification_id) 
WHERE is_read = FALSE AND is_deleted = FALSE;
```

### Optimizer Utilization & Covering Index
*   **How it works:** The database engine queries the partial composite index tree. Since it filters specifically by `is_read = FALSE` and `is_deleted = FALSE`, only unread, non-deleted entries exist in the index.
*   **Covering Index (Index-Only Scan):** By including `notification_id` using the `INCLUDE` clause, the optimizer retrieves the keys required to join `notifications` without looking up the heap tables of `notification_read_statuses`, resulting in an Index-Only scan.

### Why Indexing Every Column is Prohibited
1.  **Write Overhead:** Every write operation (`INSERT`, `UPDATE`, `DELETE`) requires updating its corresponding indexes, degrading API write performance.
2.  **Storage Footprint:** Each index occupies disk space and RAM. Excess indexes squeeze the hot cache memory footprint, triggering Disk I/O.
3.  **Optimizer Plan Confusion:** Too many indexes confuse query planners, leading to suboptimal index choices or index-merging routines.

---

## Pagination Strategy

| Pagination Type | Definition / Mechanism | Best Use Case | Limitations |
| :--- | :--- | :--- | :--- |
| **OFFSET / LIMIT** | Skips $N$ records before returning the next set of rows. | Static data lists, low page ranges, admin dashboards requiring direct jumps to middle pages. | Performance degrades to $O(N)$ at high offsets. Results drift or skip if records are added concurrently. |
| **Cursor-based** | Uses unique sequence markers (e.g., `(created_at, id)`) to pull subsequent records. | Real-time scroll feeds, mobile infinite scroll UI, high-volume activity listings. | Cannot jump to arbitrary pages (e.g., "Go to Page 15") directly without sequential retrieval. |

---

## Additional Query
Fetches all Placement notifications generated during the last 7 days.

```sql
SELECT 
    id,
    title,
    message,
    payload,
    created_at
FROM notifications
WHERE type = 'placement'
  AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Optimization Index
```sql
CREATE INDEX idx_notifications_type_date 
ON notifications (type, created_at DESC);
```

---

## Computational Complexity (After Optimization)
*   **Time Complexity:** $O(\log N + K)$ where $N$ is the total record count and $K$ is the page limit size, achieving near-constant search performance.
*   **Space Complexity:** $O(K)$ for processing only the target limit array in memory.

---

# Stage 4

## Architectural Caching & Delivery Strategy

The techniques for mitigating database load and improving scalable delivery are detailed below:

| Caching & Delivery Technique | Purpose | Advantages | Limitations | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Browser Cache** | Cache static assets and client config data in browser storage. | Eliminates network latency for assets; reduces gateway traffic. | Hard to invalidate instantly without cache-busting headers. | Static UI layouts, system logos, client themes. |
| **HTTP Cache** | Utilize headers (`Cache-Control`, `ETag`) to validate feed freshness. | Bypasses server payload building if data has not changed. | Requires roundtrip validation checks to server. | Infrequently updated API notification lists. |
| **Redis Cache** | Store unread counts and recent feeds in memory. | Sub-millisecond reads; reduces RDBMS execution requests. | Risk of cache inconsistency; requires eviction policy. | Storing count of unread notifications per student. |
| **API Response Caching** | Cache compiled API JSON payloads at the edge or gateway. | Reduces application execution time. | Cannot easily personalize caches for user-specific feeds. | Global notification announcements (placement alerts). |
| **Pagination** | Break data queries into manageable database blocks. | Lower network payloads; optimal memory consumption. | User experience is non-fluid without lazy execution. | Structured data tables, history archives. |
| **Infinite Scroll** | Dynamically append elements as users scroll down pages. | Higher user engagement; seamless page progression. | Hard to bookmark page locations; footer accessibility issues. | Mobile notifications feed, activity timelines. |
| **Lazy Loading** | Load details and secondary assets only when visible. | Conserves frontend loading memory and API pipeline. | Visual delay when user scrolls faster than execution. | Detailed attachments or payload previews in notification modals. |
| **Background Refresh** | Synchronize notification caches in background states. | Feed is instantly ready when the UI is opened. | Battery drain on mobile devices; unnecessary API hits. | Desktop tray managers, native mobile applications. |
| **Polling** | Regularly query backend server for new alerts. | Simple implementation using client intervals. | Creates "empty query" load on API endpoints. | Legacy portals without streaming server capabilities. |
| **WebSockets** | Continuous bidirectional TCP connection with clients. | Sub-second real-time alert updates. | High connection state persistence overhead on server nodes. | Direct real-time alerts on active screens. |
| **Server-Sent Events (SSE)** | Unidirectional push stream from server to clients. | Lighter than WebSockets; automatically handles reconnects. | Limited parallel browser connections (HTTP/1.1 limit). | Live notification streams to students' dashboards. |
| **Push Notifications** | Mobile OS service (APNS, FCM) delivery system. | Alerts users when application is completely closed. | Delivery is not guaranteed; subject to OS throttling. | Urgent placement deadline or result warnings. |
| **Read Replicas** | Segregate read queries to database replicas. | Offloads search and list operations from primary write node. | Minor replication lag can result in brief dirty reads. | High read-to-write ratio scenarios (checking alerts). |
| **Connection Pooling** | Maintain active database connections for reuse. | Eliminates TCP handshake latency for DB queries. | Bound by pool size limits during peak loads. | High-throughput web servers querying database. |
| **CDN** | Cache static media files near geographical users. | Minimizes latency; offloads primary media storage. | Ineffective for dynamic or personalized user queries. | Serving attachment documents, banners, and recruiter logos. |
| **Database Partitioning** | Separate large tables into separate logical segments. | Faster queries; targeted vacuum operations. | Increases query complexity if filters span partitions. | Splitting notifications table by `created_at` timestamp. |

---

## Recommended Architecture Diagram

```
                 +-----------------------+
                 |     Web/Mobile Client |
                 +-----------+-----------+
                             |
                             | WebSockets / SSE / HTTPS
                             v
                 +-----------+-----------+
                 |      API Gateway      |
                 +-----------+-----------+
                             |
                             +------------------------+
                             |                        |
                             | Route API Reads        | Route Writes / Admin Actions
                             v                        v
                 +-----------+-----------+  +---------+-------------+
                 |  Redis Cache Cluster  |  |  Application Server   |
                 +-----------+-----------+  +---------+-------------+
                             |                        |
             Cache Miss      |                        | Write Transaction
             Get Feed        v                        v
                 +-----------+-----------+  +---------+-------------+
                 | Read Replica DB (Postgre)| | Primary Database (Postgre)|
                 +-----------------------+  +---------+-------------+
                                                       |
                                                       | Replication Stream
                                                       v
                                            +----------+------------+
                                            | Read Replica DB (Postgre)|
                                            +-----------------------+
```

### Why this Architecture is Scalable
1.  **Read/Write Split:** Segregating transactional writes (marking notifications read) to the primary node and read queries (fetching list feeds) to replica nodes prevents database lock escalation.
2.  **In-Memory Caching:** Hot data (unread count badges) is fetched from the Redis Cache Cluster, shielding databases from repeated reads during active student browsing.
3.  **Real-Time Push Integration:** WebSockets/SSE channels broadcast notifications immediately when generated, bypassing constant client polling cycles.

---

## Performance Improvements

*   **Reduced Database Load:** Over 90% of dashboard load queries are served directly by Redis or CDN caches.
*   **Faster Response Time:** Database query latencies drop from seconds to single-digit milliseconds through indexing and caching.
*   **Better User Experience:** Dynamic scroll feeds and immediate real-time socket events remove page load latency.
*   **Horizontal Scalability:** Add read database replicas and application servers behind load balancers to scale client request volume.
*   **High Availability:** Read replicas can be promoted to Primary if the master database node fails.
*   **Fault Tolerance:** Failure in real-time stream layers defaults back to standard HTTPS API queries, ensuring continuous system operation.

# Stage 5

## Problems

The current implementation of the `notify_all` function has critical architectural flaws:
```javascript
function notify_all(student_ids, message){
    for(student_id in student_ids){
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
    }
}
```

*   **Sequential Execution:** The loop processes one student at a time. If notifying one student takes 300ms, notifying 50,000 students takes 15,000 seconds (4.16 hours).
*   **Poor Scalability:** The function scale is $O(N)$ CPU-bound on a single thread. The server event loop will be blocked, rendering the application unresponsive during execution.
*   **Blocking I/O:** The synchronous processing of network requests to external SMTP servers (`send_email`), database storage operations (`save_to_db`), and push service servers (`push_to_app`) blocks thread execution.
*   **Failure Handling:** There is no `try/catch` or recovery boundary. A single failure (e.g., SMTP timeout) halts the entire execution, leaving subsequent students unnotified.
*   **Retry Issues:** If the process fails halfway, restarting it results in duplicate notifications sent to students who were already processed.
*   **Partial Failures:** If `send_email` succeeds but `save_to_db` fails, the system enters an inconsistent state with no record of the sent notification.
*   **No Queue:** Surges in notifications immediately overload database connections and rate-limit external APIs.
*   **No Batching:** Database writes and email dispatches are performed individually instead of bulk batches, creating excessive transaction overhead.
*   **No Monitoring:** Lacks logs, distributed tracing, metrics, or auditing hooks to trace failures.
*   **No Idempotency:** Running the function twice with the same inputs sends duplicate emails and push alerts.
*   **Tight Coupling:** Content generation, delivery mechanisms (Email/Push), and database transactions are coupled in a single function, violating the Single Responsibility Principle.

---

## Improved Architecture Design

```
[API Endpoint]
      │
      ▼
[Message Queue (RabbitMQ)]
      │
      ├───────────────────────┬───────────────────────┐
      ▼                       ▼                       ▼
[Worker Node 1]         [Worker Node 2]         [Worker Node 3]
      │                       │                       │
      ├───────────────────────┼───────────────────────┤
      ▼                       ▼                       ▼
[Database Save]         [Email Service]       [Push Notification]
```

*   **Asynchronous Processing:** The API Gateway quickly validates the request, publishes the dispatch job payload to a message queue, and returns a `202 Accepted` status, decoupling client wait time from execution.
*   **Retry Mechanism:** Workers utilize exponential backoff policies. Failed tasks are re-queued with delayed delivery to resolve transient network drops.
*   **Dead Letter Queue (DLQ):** Tasks failing after max retries (e.g. 5 times) are routed to a DLQ for administrator auditing and manual replay, isolating toxic messages.
*   **Idempotency:** A unique `idempotency_key` is assigned to each notification. Workers verify if the key exists in Redis/Database before delivering.
*   **Batch Processing:** Database logs are grouped and written in bulk batches (e.g., 500 records per transaction) to optimize transaction logs.
*   **Parallel Workers:** Multiple stateless consumer containers consume from the queue concurrently, scaling throughput horizontally.
*   **Event-Driven Architecture:** The notification cycle acts as an event payload stream, enabling flexible addition of new channels (e.g., SMS, Slack) without altering core logic.

### Queue Technology Selection: RabbitMQ
RabbitMQ is selected for the following reasons:
1.  **Strict Delivery Guarantees:** Supports manual consumer acknowledgments (ACK/NACK), ensuring messages are never lost if a worker dies mid-execution.
2.  **Routing Flexibility:** Advanced Exchange types (Direct, Topic) allow targeted routing (e.g., routing 'placement' notifications to high-priority queues).
3.  **Built-in Dead Lettering & TTL:** Provides native queue configurations for TTL (Time-To-Live) expiration and direct routing of failed messages to DLQs.

---

## Production-Quality Pseudocode

```javascript
// Pseudocode for Scalable Notification Dispatch Service
const amqp = require('amqplib');
const db = require('./db');
const emailService = require('./email');
const pushService = require('./push');
const logger = require('./logging-middleware');

const QUEUE_NAME = 'notification_dispatch_queue';
const DLQ_NAME = 'notification_dlq';

// Initialize Message Broker Connections and Queues
async function initializeQueue() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Assert Dead Letter Queue (DLQ)
        await channel.assertQueue(DLQ_NAME, { durable: true });

        // Assert Main Work Queue bound to DLQ
        await channel.assertQueue(QUEUE_NAME, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': '',
                'x-dead-letter-routing-key': DLQ_NAME
            }
        });

        logger.info('Queue Infrastructure Initialized Successfully');
        return channel;
    } catch (error) {
        logger.error('Failed to initialize queue infrastructure', { error });
        throw error;
    }
}

// Worker Pool Consumer Definition
async function startWorkerPool(channel) {
    // Prefetch limits concurrency per worker node to prevent exhaustion
    await channel.prefetch(100);

    logger.info('Notification Workers listening for messages...');

    channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        const payload = JSON.parse(msg.content.toString());
        const { notification_id, student_id, message, retry_count = 0 } = payload;
        
        logger.info('Job received by worker', { notification_id, student_id });

        try {
            // 1. Idempotency Check: Verify if database record already reports delivery
            const deliveryRecord = await db.getDeliveryStatus(notification_id, student_id);
            if (deliveryRecord && deliveryRecord.status === 'DELIVERED') {
                logger.info('Duplicate job detected. Skipping execution.', { notification_id, student_id });
                channel.ack(msg);
                return;
            }

            // 2. Database Save (Establish record of execution intent)
            await db.saveDeliveryRecord({
                notification_id,
                student_id,
                status: 'PROCESSING',
                updated_at: new Date()
            });

            // 3. Parallel Network Delivery Dispatches
            await Promise.all([
                emailService.send({ student_id, message }),
                pushService.send({ student_id, message })
            ]);

            // 4. Update Database to Completed
            await db.updateDeliveryStatus(notification_id, student_id, 'DELIVERED');
            
            logger.info('Notification delivered successfully', { notification_id, student_id });
            channel.ack(msg); // Acknowledge message deletion from queue
        } catch (error) {
            logger.error('Worker processing exception', { notification_id, student_id, error: error.message });

            const nextRetry = retry_count + 1;
            if (nextRetry <= 5) {
                // Exponential Backoff Retry Strategy (Requeue with delay)
                const backoffDelay = Math.pow(2, nextRetry) * 1000;
                setTimeout(() => {
                    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify({
                        ...payload,
                        retry_count: nextRetry
                    })), { persistent: true });
                    channel.ack(msg); // Remove current message instance
                }, backoffDelay);
            } else {
                // Max retries exhausted - Route to Dead Letter Queue
                logger.error('Max retries reached. Routing message to DLQ.', { notification_id });
                channel.nack(msg, false, false); // NACK without requeue triggers DLQ routing
            }
        }
    });
}
```

---

## Architectural Strategy: Sequencing and Rollbacks

### Should saving to Database occur before sending Emails?
**Yes.** Database logging must occur prior to invoking external delivery processes. 
*   **Audit Trail:** Writing a pending record (`PROCESSING` state) guarantees a record of execution intent remains if the server loses power during SMTP transmission.
*   **Idempotency Protection:** The database record acts as a lock. If the worker crashes mid-email delivery and the job is re-queued, the next worker checks the database state to prevent duplicate dispatches.

### Should email failures rollback database transactions?
**No.** Email systems are fundamentally asynchronous and external.
*   **Failure Isolation:** SMTP server failures should not wipe database records. A rollback deletes the historical audit trail, masking the event.
*   **Tracking and Retry Resolution:** Instead of rolling back transactions, the database status is marked as `FAILED` or `RETRYING` with failure metadata. This allows scheduler workflows or worker processes to selectively target failed entries without corrupting historical database state.


