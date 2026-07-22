import { useState, useCallback } from 'react';
import { loginApi, logoutApi, refreshApi } from '../models/auth';

export interface AuthState {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    loading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { accessToken } = await loginApi({ email, password });
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
      setState((s) => ({ ...s, accessToken }));
      return accessToken;
    } catch {
      setState({ accessToken: null, loading: false, error: null });
      throw new Error('Session expired');
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutApi().catch(() => null);
    setState({ accessToken: null, loading: false, error: null });
  }, []);

  return { ...state, login, refresh, logout };
}
