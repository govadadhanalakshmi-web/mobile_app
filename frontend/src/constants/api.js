import { Platform } from 'react-native';

/**
 * API Network Configuration
 * Android Emulator loops back to host via 10.0.2.2.
 * iOS Simulator and Web connect via localhost.
 * Change to your machine's LAN IP (e.g., http://192.168.1.X:8000) when running on physical device via Expo Go.
 */
const DEV_HOST = 'http://localhost:8000';

export const API_BASE_URL = DEV_HOST;

export const ENDPOINTS = {
  STATUSES: `${API_BASE_URL}/api/statuses/index.php`,
  TODOS: `${API_BASE_URL}/api/todos/index.php`,
  TODO_CREATE: `${API_BASE_URL}/api/todos/create.php`,
  TODO_UPDATE: `${API_BASE_URL}/api/todos/update.php`,
  TODO_DELETE: `${API_BASE_URL}/api/todos/delete.php`,
};

