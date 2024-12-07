import { useState, useEffect, useCallback } from 'react';
import { Auth, Me } from '../app/src/auth'; // Adjust the import path as needed

const auth = new Auth();

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Me | null>(null);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      await auth.init();
      setIsAuthenticated(!!auth.me);
      setUser(auth.me || null);
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (token?: string) => {
    setIsLoading(true);
    try {
      if (token) {
        await auth.manualLogin(token);
      } else {
        await auth.login();
      }
      setIsAuthenticated(!!auth.me);
      setUser(auth.me || null);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await auth.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    setIsLoading(true);
    try {
      await auth.refreshToken();
      setIsAuthenticated(!!auth.me);
      setUser(auth.me || null);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthenticated, isLoading, user, login, logout, refreshToken };
}