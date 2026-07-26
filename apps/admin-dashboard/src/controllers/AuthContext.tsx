import { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { loginApi, logoutApi, refreshApi } from '../models/auth';
import { setAccessToken, setSessionExpiredHandler } from '../models/http-client';

export interface AuthState {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string>;
  refresh: () => Promise<string>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    loading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { accessToken } = await loginApi({ email, password });
      setAccessToken(accessToken);
      setState({ accessToken, loading: false, error: null });
      return accessToken;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState((s) => ({ ...s, loading: false, error: message }));
      throw err;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { accessToken } = await refreshApi();
      setAccessToken(accessToken);
      setState((s) => ({ ...s, accessToken }));
      return accessToken;
    } catch {
      setAccessToken(null);
      setState({ accessToken: null, loading: false, error: null });
      throw new Error('Session expired');
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi().catch(() => null);
    setAccessToken(null);
    setState({ accessToken: null, loading: false, error: null });
  }, []);

  // Sync token on mount if refresh succeeds
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      setState({ accessToken: null, loading: false, error: null });
    });
    refreshApi()
      .then(({ accessToken }) => {
        setAccessToken(accessToken);
        setState((s) => ({ ...s, accessToken }));
      })
      .catch(() => {
        // No valid session — that's fine, user will log in
      });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
