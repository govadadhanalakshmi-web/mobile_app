import { ENDPOINTS } from '../constants/api';

/**
 * Service Layer for Todo Operations
 * Implements SWR / Offline-First Fallback, JWT authorization, bounded requests, and timeout protection.
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
    description: 'PascalCase tables TodoStatuses and TodoItems with utf8mb4_0900_ai_ci collation.',
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
    description: 'Prepared statements, input sanitization against XSS, and JWT authentication.',
    status_id: 3,
    status_code: 'completed',
    status_label: 'Completed',
    color_code: '#10b981',
    due_date: '2026-10-28',
    created_at: '2026-10-28 11:30:00',
  },
  {
    id: 3,
    title: 'Develop Google Tasks Minimalist UI',
    description: 'Build GoogleTasksHeader, GoogleTaskItem, and responsive task management.',
    status_id: 2,
    status_code: 'in_progress',
    status_label: 'In Progress',
    color_code: '#3b82f6',
    due_date: '2026-10-30',
    created_at: '2026-10-28 14:00:00',
  },
];

let nextLocalId = 4;

/**
 * Helper to fetch with timeout and optional Bearer auth token
 */
async function fetchWithTimeout(url, options = {}, token = null) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
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
  async getStatuses(token = null) {
    try {
      const data = await fetchWithTimeout(ENDPOINTS.STATUSES, { method: 'GET' }, token);
      return data.statuses || DEFAULT_STATUSES;
    } catch {
      return DEFAULT_STATUSES;
    }
  },

  /**
   * Fetch bounded paginated todos (with offline fallback)
   */
  async getTodos({ page = 1, limit = 20, statusId = null, search = '' } = {}, token = null) {
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
      const data = await fetchWithTimeout(url, { method: 'GET' }, token);

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
  async createTodo(payload, token = null) {
    try {
      const data = await fetchWithTimeout(
        ENDPOINTS.TODO_CREATE,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        token
      );
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
      };
      localTodos.unshift(newTodo);
      return newTodo;
    }
  },

  /**
   * Update an existing todo
   */
  async updateTodo(id, payload, token = null) {
    try {
      const data = await fetchWithTimeout(
        ENDPOINTS.TODO_UPDATE,
        {
          method: 'PUT',
          body: JSON.stringify({ id, ...payload }),
        },
        token
      );
      return data.todo;
    } catch {
      // Local offline update
      const index = localTodos.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error('Todo item not found in local offline storage.');
      }
      const existing = localTodos[index];
      const status = payload.status_id
        ? DEFAULT_STATUSES.find((s) => s.id === payload.status_id) || existing
        : existing;

      const updated = {
        ...existing,
        ...payload,
        status_code: status.status_code || existing.status_code,
        status_label: status.status_label || existing.status_label,
        color_code: status.color_code || existing.color_code,
        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      localTodos[index] = updated;
      return updated;
    }
  },

  /**
   * Soft-delete a todo
   */
  async deleteTodo(id, token = null) {
    try {
      const data = await fetchWithTimeout(
        ENDPOINTS.TODO_DELETE,
        {
          method: 'DELETE',
          body: JSON.stringify({ id }),
        },
        token
      );
      return data;
    } catch {
      // Local offline soft delete
      const index = localTodos.findIndex((t) => t.id === id);
      if (index !== -1) {
        localTodos[index].is_deleted = 1;
      }
      return { id, is_deleted: 1 };
    }
  },
};
