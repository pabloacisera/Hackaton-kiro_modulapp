const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface InitiateRegistrationRequest {
  email: string;
}

export interface VerifyInviteCodeRequest {
  token: string;
  code: string;
}

export interface CompleteRegistrationRequest {
  token: string;
  password: string;
}

export async function initiateRegistrationApi(
  data: InitiateRegistrationRequest,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/auth/register/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? 'Registration failed'), { status: res.status });
  }
  return res.json();
}

export async function verifyInviteCodeApi(
  data: VerifyInviteCodeRequest,
): Promise<{ verified: boolean }> {
  const res = await fetch(`${API_BASE}/admin/auth/register/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? 'Verification failed'), { status: res.status });
  }
  return res.json();
}

export async function completeRegistrationApi(
  data: CompleteRegistrationRequest,
): Promise<{ id: string; email: string }> {
  const res = await fetch(`${API_BASE}/admin/auth/register/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? 'Registration completion failed'), {
      status: res.status,
    });
  }
  return res.json();
}

export async function generateInviteCodeApi(
  accessToken: string,
): Promise<{ code: string; expiresIn: number }> {
  const res = await fetch(`${API_BASE}/admin/settings/invite-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? 'Failed to generate invite code'), {
      status: res.status,
    });
  }
  return res.json();
}
