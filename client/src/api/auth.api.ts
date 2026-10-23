import { api } from "./client";

export interface SessionUser {
  id: string;
  email: string;
  role: "PARENT" | "TEACHER" | "ADMIN";
  parent?: { id: string; fullName: string; phone: string } | null;
  teacher?: { id: string; fullName: string } | null;
}

export async function loginRequest(email: string, password: string): Promise<SessionUser> {
  const { data } = await api.post<{ user: SessionUser }>("/auth/login", { email, password });
  return data.user;
}

export async function fetchMe(): Promise<SessionUser | null> {
  try {
    const { data } = await api.get<{ user: SessionUser }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await api.post("/auth/logout");
}

export async function forgotPasswordRequest(email: string): Promise<string> {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
  return data.message;
}

export async function resetPasswordRequest(token: string, password: string): Promise<string> {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", {
    token,
    password,
  });
  return data.message;
}
