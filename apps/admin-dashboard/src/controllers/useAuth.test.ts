import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from './useAuth';

vi.mock('../models/auth', () => ({
  loginApi: vi.fn(),
  refreshApi: vi.fn(),
  logoutApi: vi.fn(),
}));

import { loginApi, refreshApi, logoutApi } from '../models/auth';

const mockLoginApi = vi.mocked(loginApi);
const mockRefreshApi = vi.mocked(refreshApi);
const mockLogoutApi = vi.mocked(logoutApi);

describe('useAuth controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with no token and no error', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.accessToken).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sets accessToken on successful login', async () => {
    mockLoginApi.mockResolvedValue({ accessToken: 'jwt-abc', expiresIn: 900 });
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login('admin@modula.com', 'pass123');
    });
    expect(result.current.accessToken).toBe('jwt-abc');
    expect(result.current.error).toBeNull();
  });

  it('sets error on failed login', async () => {
    mockLoginApi.mockRejectedValue(new Error('Invalid credentials'));
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login('bad@email.com', 'wrong').catch(() => null);
    });
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.accessToken).toBeNull();
  });

  it('updates accessToken on refresh', async () => {
    mockRefreshApi.mockResolvedValue({ accessToken: 'new-jwt', expiresIn: 900 });
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.accessToken).toBe('new-jwt');
  });

  it('clears token on logout', async () => {
    mockLoginApi.mockResolvedValue({ accessToken: 'jwt-abc', expiresIn: 900 });
    mockLogoutApi.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.login('a@b.com', 'pass'); });
    expect(result.current.accessToken).toBe('jwt-abc');
    await act(async () => { await result.current.logout(); });
    expect(result.current.accessToken).toBeNull();
  });
});
