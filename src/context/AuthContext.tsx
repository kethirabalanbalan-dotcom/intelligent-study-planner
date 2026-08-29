import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccount, AuthSession } from '../types';

const USERS_STORAGE_KEY = 'study_planner_registered_users_v2';
const SESSION_STORAGE_KEY = 'study_planner_active_session_v2';

const DEFAULT_DEMO_USERS: UserAccount[] = [
  {
    id: 'user_karthik',
    name: 'Karthik',
    email: 'karthik@example.com',
    password: 'password123',
    avatarColor: '#6366F1',
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'user_priya',
    name: 'Priya',
    email: 'priya@example.com',
    password: 'password123',
    avatarColor: '#EC4899',
    createdAt: '2026-08-10T10:00:00.000Z'
  }
];

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  users: UserAccount[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPasswordWithEmail: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateCurrentUserProfile: (updated: Partial<UserAccount>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_DEMO_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Save users array to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users database:', e);
    }
  }, [users]);

  // Restore session on initial mount
  useEffect(() => {
    try {
      let sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionStr) {
        sessionStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
      }

      if (sessionStr) {
        const session: AuthSession = JSON.parse(sessionStr);
        const matchedUser = users.find((u) => u.id === session.userId);
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [users]);

  // Login handler
  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; error?: string }> => {
      // Simulate brief network latency for authentic feel
      await new Promise((resolve) => setTimeout(resolve, 350));

      const normalizedEmail = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return {
          success: false,
          error: 'No account found with this email address. Please check your spelling or sign up.'
        };
      }

      if (user.password && user.password !== password) {
        return {
          success: false,
          error: 'Incorrect password. Please verify your credentials and try again.'
        };
      }

      const session: AuthSession = {
        userId: user.id,
        rememberMe,
        loggedInAt: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }

      setCurrentUser(user);
      return { success: true };
    },
    [users]
  );

  // Register handler
  const register = useCallback(
    async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const trimmedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();

      if (!trimmedName || trimmedName.length < 2) {
        return { success: false, error: 'Please enter a valid full name (minimum 2 characters).' };
      }

      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return { success: false, error: 'An account with this email already exists. Please log in.' };
      }

      const colorPalette = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#14B8A6'];
      const avatarColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      const newUser: UserAccount = {
        id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: trimmedName,
        email: normalizedEmail,
        password,
        avatarColor,
        createdAt: new Date().toISOString()
      };

      setUsers((prev) => [...prev, newUser]);

      // Automatically log the new user in
      const session: AuthSession = {
        userId: newUser.id,
        rememberMe: true,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setCurrentUser(newUser);

      return { success: true };
    },
    [users]
  );

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  // Forgot password simulation
  const forgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const normalizedEmail = email.trim().toLowerCase();
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return {
          success: false,
          message: `No account exists with email "${normalizedEmail}". Please create an account.`
        };
      }

      return {
        success: true,
        message: `Password reset instructions have been generated for ${user.email}. You can also reset it directly here.`
      };
    },
    [users]
  );

  // Reset password directly
  const resetPasswordWithEmail = useCallback(
    async (email: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const normalizedEmail = email.trim().toLowerCase();
      const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

      if (userIndex === -1) {
        return { success: false, message: 'Account not found.' };
      }

      if (newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }

      setUsers((prev) => {
        const copy = [...prev];
        copy[userIndex] = { ...copy[userIndex], password: newPassword };
        return copy;
      });

      return { success: true, message: 'Your password has been successfully updated! You can now log in.' };
    },
    [users]
  );

  // Update current user's profile info
  const updateCurrentUserProfile = useCallback((updated: Partial<UserAccount>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      setUsers((allUsers) => allUsers.map((u) => (u.id === prev.id ? merged : u)));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoadingAuth,
        users,
        login,
        register,
        logout,
        forgotPassword,
        resetPasswordWithEmail,
        updateCurrentUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
