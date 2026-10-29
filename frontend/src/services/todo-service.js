import { ENDPOINTS } from '../constants/api';

/**
 * Service Layer for Todo Operations
 * Implements SWR / Offline-First Fallback, bounded requests, and timeout protection.
 */

const REQUEST_TIMEOUT_MS = 6000;

// Default statuses lookup
const DEFAULT_STATUSES = [
  { id: 1, status_code: 'pending', status_label: 'Pending', color_code: '#f59e0b', sort_order: 1 },
  { id: 2, status_code: 'in_progress', status_label: 'In Progress', color_code: '#3b82f6', sort_order: 2 },
  { id: 3, status_code: 'completed', status_label: 'Completed', color_code: '#10b981', sort_order: 3 },
];

// In-Memory Offline Storage (Offline-First / SWR Tenet)
let localTodos = [
  {
    id: 1,
    title: 'Design MySQL Database Schema',
    description: 'PascalCase tables TodoStatuses and TodoItems with utf8mb4_0900_ai_ci collation and strict indexes.',
    status_id: 3,
    status_code: 'completed',
    status_label: 'Completed',
    color_code: '#10b981',
    due_date: '2026-10-27',
    created_at: '2026-10-27 10:00:00',
  },
  {
    id: 2,
    title: 'Build PHP 8 PDO REST API',
    description: 'Prepared statements, input sanitization against XSS, and {"status": "success|error"} JSON envelope.',
    status_id: 3,
    status_code: 'completed',
    status_label: 'Completed',
    color_code: '#10b981',
    due_date: '2026-10-28',
    created_at: '2026-10-28 11:30:00',
  },
  {
    id: 3,
    title: 'Develop React Native Glassmorphic UI',
    description: 'Build Header, StatusFilterBar, TodoCard (React.memo), and TodoModal for task management.',
    status_id: 2,
    status_code: 'in_progress',
    status_label: 'In Progress',
    color_code: '#3b82f6',
    due_date: '2026-10-30',
    created_at: '2026-10-28 14:00:00',
  },
  {
    id: 4,
    title: 'Setup CI/CD Pipeline & Firebase App Distribution',
    description: 'Automate Jest and PHPUnit testing, EAS APK build, and deployment to Firebase testers.',
    status_id: 1,
    status_code: 'pending',
    status_label: 'Pending',
    color_code: '#f59e0b',
    due_date: '2026-11-02',
    created_at: '2026-10-28 16:00:00',
  },
  {
    id: 5,
    title: 'Perform Maestro E2E Cloud Testing on BrowserStack',
    description: 'Run automated user flow tests across real Android devices on BrowserStack cloud farm.',
    status_id: 1,
    status_code: 'pending',
    status_label: 'Pending',
    color_code: '#f59e0b',
    due_date: '2026-11-05',
    created_at: '2026-10-28 18:00:00',
  },
];

let nextLocalId = 6;

/**
 * Helper to fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);

    const json = await response.json();
    if (!response.ok || json.status === 'error') {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    return json.data;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const TodoService = {
  /**
   * Fetch all status lookups (with offline fallback)
   */
  async getStatuses() {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.STATUSES, { method: 'GET' });
      return data.statuses || DEFAULT_STATUSES;
    } catch {
      return DEFAULT_STATUSES;
    }
  },

  /**
   * Fetch bounded paginated todos (with offline fallback)
   */
  async getTodos({ page = 1, limit = 20, statusId = null, search = '' } = {}) {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (statusId !== null && statusId !== undefined && statusId !== '') {
        params.append('status_id', String(statusId));
      }

      if (search && search.trim() !== '') {
        params.append('search', search.trim());
      }

      const url = `${ENDPOINTS.TODOS}?${params.toString()}`;
      const data = await fetchWithTimeout(url, { method: 'GET' });

      return {
        todos: data.todos || [],
        pagination: data.pagination || { total: 0, page: 1, limit: 20, total_pages: 0 },
      };
    } catch (err) {
      console.warn('Backend API offline or unreachable. Serving local offline storage:', err.message);

      // Filter local storage
      let filtered = localTodos.filter((t) => !t.is_deleted);
      if (statusId) {
        filtered = filtered.filter((t) => t.status_id === Number(statusId));
      }
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            (t.description && t.description.toLowerCase().includes(query))
        );
      }

      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        todos: paginated,
        pagination: {
          total: filtered.length,
          page,
          limit,
          total_pages: Math.ceil(filtered.length / limit) || 1,
        },
      };
    }
  },

  /**
   * Create a new todo
   */
  async createTodo(payload) {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.TODO_CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return data.todo;
    } catch {
      // Local offline creation
      const status = DEFAULT_STATUSES.find((s) => s.id === payload.status_id) || DEFAULT_STATUSES[0];
      const newTodo = {
        id: nextLocalId++,
        title: payload.title,
        description: payload.description || null,
        status_id: status.id,
        status_code: status.status_code,
        status_label: status.status_label,
        color_code: status.color_code,
        due_date: payload.due_date || null,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        is_deleted: 0,
      };
      localTodos.unshift(newTodo);
      return newTodo;
    }
  },

  /**
   * Update existing todo
   */
  async updateTodo(id, payload) {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.TODO_UPDATE, {
        method: 'POST',
        body: JSON.stringify({ id, ...payload }),
      });
      return data.todo;
    } catch {
      // Local offline update
      const idx = localTodos.findIndex((t) => t.id === id);
      if (idx !== -1) {
        const current = localTodos[idx];
        const statusId = payload.status_id !== undefined ? payload.status_id : current.status_id;
        const status = DEFAULT_STATUSES.find((s) => s.id === statusId) || DEFAULT_STATUSES[0];

        localTodos[idx] = {
          ...current,
          ...payload,
          status_id: status.id,
          status_code: status.status_code,
          status_label: status.status_label,
          color_code: status.color_code,
        };
        return localTodos[idx];
      }
      throw new Error('Todo not found');
    }
  },

  /**
   * Soft delete a todo
   */
  async deleteTodo(id) {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.TODO_DELETE, {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      return data;
    } catch {
      // Local soft delete
      localTodos = localTodos.filter((t) => t.id !== id);
      return { id, is_deleted: 1 };
    }
  },
};
