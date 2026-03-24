/**
 * API base URL. Set VITE_API_URL in .env (e.g. http://localhost:8000).
 */
export const getApiUrl = () => import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type UserResponse = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserResponse;
};

export type RegisterResponse = {
  id: string;
  email: string;
  message: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = text ? JSON.parse(text) : {};
      detail = data.detail ?? (Array.isArray(data.detail) ? data.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ") : data.detail) ?? detail;
    } catch {
      if (text) detail = text;
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return text ? JSON.parse(text) : ({} as T);
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${getApiUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function register(email: string, password: string): Promise<RegisterResponse> {
  const res = await fetch(`${getApiUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function logout(token: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 401) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}

export async function getMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${getApiUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserResponse>(res);
}