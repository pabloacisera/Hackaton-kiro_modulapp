import type { LoginRequest, LoginResponse, RefreshResponse } from '@modula/shared-types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? 'Login failed'), { status: res.status });
  }
  return res.json();
}

export async function refreshApi(): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/admin/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
