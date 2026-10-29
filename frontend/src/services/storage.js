import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Tier 2 Fast Key-Value & Private Disk Storage
 * Compliant with Rule 5 (Storage Stratification) & Zero-Leak Discipline.
 * Uses private sandboxed disk storage on Android/iOS native,
 * and graceful fallback to localStorage / in-memory.
 */

const memoryCache = new Map();

function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export const StorageService = {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return memoryCache.get(key) || null;
      }

      // Android & iOS Native: private documentDirectory sandbox
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${sanitizeKey(key)}.json`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          return await FileSystem.readAsStringAsync(fileUri);
        }
      }

      return memoryCache.get(key) || null;
    } catch (e) {
      return memoryCache.get(key) || null;
    }
  },

  async setItem(key, value) {
    try {
      const valString = typeof value === 'string' ? value : JSON.stringify(value);
      memoryCache.set(key, valString);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, valString);
        }
        return;
      }

      // Android & iOS Native
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${sanitizeKey(key)}.json`;
        await FileSystem.writeAsStringAsync(fileUri, valString);
      }
    } catch (e) {
      // Fallback in memory
      memoryCache.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  },

  async removeItem(key) {
    try {
      memoryCache.delete(key);

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }

      // Android & iOS Native
      if (FileSystem.documentDirectory) {
        const fileUri = `${FileSystem.documentDirectory}${sanitizeKey(key)}.json`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }
      }
    } catch (e) {
      memoryCache.delete(key);
    }
  },
};

