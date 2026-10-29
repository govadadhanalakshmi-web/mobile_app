# Enterprise React Native Todo App with PHP & MySQL

A robust, enterprise-compliant mobile Todo Application featuring a **React Native** frontend and a performant **PHP & MySQL** backend REST API.

---

## 🏗️ Architecture & Design Standards

- **Database Integrity**:
  - Collation: `utf8mb4_0900_ai_ci`
  - PascalCase Tables: `TodoItems`, `TodoStatuses`
  - snake_case Columns: `status_id`, `is_deleted`, `due_date`, `created_at`, `updated_at`
  - Status Lookup Table: `TodoStatuses` (`pending`, `in_progress`, `completed`)
  - Soft Deletes: `is_deleted = 1` (No hard deletes)
  - Foreign Key constraint: `ON DELETE RESTRICT`
  - Bounded Queries: Strict pagination (`LIMIT`, `OFFSET`) and explicit column selection (Zero `SELECT *`).

- **Backend Architecture**:
  - PHP 8+ PDO with prepared statements (SQL injection defense).
  - Centralized API helpers & exception handling (Centralized logging in `backend/logs/error.log`).
  - Strict response schema: `{"status": "success|error", "message": "...", "data": {}}`.
  - Input sanitization against XSS.

- **Mobile Optimization**:
  - 16.6ms UI thread tranquility: Asynchronous API calls with timeout protection (`AbortController`).
  - Memoized list items (`React.memo`) to eliminate redundant re-renders.
  - SWR / Optimistic UI updates with rollback defense on network failure.
  - Bounded list pagination and pull-to-refresh (`RefreshControl`).

---

## 🚀 Getting Started

### 1. Database & Backend Setup
1. Start **MySQL** (via Laragon, XAMPP, or Windows Service).
2. Run the database migration script:
   ```powershell
   # Using Laragon's PHP
   & "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" backend/database/migrate.php
   ```
3. Start the PHP API development server:
   ```powershell
   & "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" -S 0.0.0.0:8000 -t backend
   ```
   The API will be live at `http://localhost:8000`.

### 2. Frontend (React Native) Setup
1. Navigate to `frontend`:
   ```powershell
   cd frontend
   npm.cmd install
   ```
2. Start the Expo development server:
   ```powershell
   npx.cmd expo start
   ```
   - Press `a` to run on Android Emulator (`http://10.0.2.2:8000` auto-configured).
   - Press `w` to preview on Web Browser.
   - Scan the QR code using the **Expo Go** app on your physical mobile phone (ensure `API_BASE_URL` in `src/constants/api.js` is set to your PC's local Wi-Fi IP e.g. `http://192.168.1.X:8000`).

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/statuses/index.php` | List all available task statuses |
| `GET` | `/api/todos/index.php?page=1&limit=20&status_id=1&search=test` | Paginated list with status filter and search |
| `POST` | `/api/todos/create.php` | Create task `{ "title": "...", "status_id": 1, ... }` |
| `POST` / `PUT` | `/api/todos/update.php` | Update task `{ "id": 1, "status_id": 2, ... }` |
| `POST` / `DELETE` | `/api/todos/delete.php` | Soft delete task `{ "id": 1 }` |

