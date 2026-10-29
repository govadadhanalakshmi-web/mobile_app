import React, { createContext, useContext, useState, useEffect } from 'react';
import { ENDPOINTS } from '../constants/api';
import { StorageService } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1. Restore Auth State on Application Mount (Tier 2 Storage Stratification)
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await StorageService.getItem('todomaster_token');
        const storedUser = await StorageService.getItem('todomaster_user');

        if (storedToken && storedUser) {
          const parsedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
          setToken(storedToken);
          setUser(parsedUser);

          // Background revalidation (SWR) with ME endpoint
          fetch(ENDPOINTS.ME, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data?.status === 'success' && data?.data?.user) {
                setUser(data.data.user);
                StorageService.setItem('todomaster_user', JSON.stringify(data.data.user));
              } else if (data?.status === 'error') {
                // Token expired
                logout();
              }
            })
            .catch(() => {
              // Network offline, keep cached session for offline-first resilience
            });
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  // 2. Login Action
  const login = async (email, password) => {
    setAuthError('');
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      if (response.ok && json.status === 'success') {
        const authToken = json.data.token;
        const authUserData = json.data.user;

        setToken(authToken);
        setUser(authUserData);

        await StorageService.setItem('todomaster_token', authToken);
        await StorageService.setItem('todomaster_user', JSON.stringify(authUserData));
        return { success: true };
      } else {
        const msg = json.message || 'Login failed. Please check credentials.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
    } catch (e) {
      const msg = 'Network error: Unable to connect to server.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // 3. Register Action
  const register = async (name, email, password) => {
    setAuthError('');
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await response.json();

      if (response.ok && json.status === 'success') {
        const authToken = json.data.token;
        const authUserData = json.data.user;

        setToken(authToken);
        setUser(authUserData);

        await StorageService.setItem('todomaster_token', authToken);
        await StorageService.setItem('todomaster_user', JSON.stringify(authUserData));
        return { success: true };
      } else {
        const msg = json.message || 'Registration failed.';
        setAuthError(msg);
        return { success: false, error: msg };
      }
    } catch (e) {
      const msg = 'Network error: Unable to connect to server.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  // 4. Logout Action
  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthError('');
    await StorageService.removeItem('todomaster_token');
    await StorageService.removeItem('todomaster_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        authError,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

