import { apiClient } from './client';
import type { AuthUser, LoginPayload, SignupPayload, TokenResponse } from '../types/auth.types';

/** POST /auth/signup — creates a real account (full_name, email, password). */
export async function signup(payload: SignupPayload): Promise<AuthUser> {
  const res = await apiClient.post<AuthUser>('/auth/signup', payload);
  return res.data;
}

/** POST /auth/login — returns a JWT access token. */
export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>('/auth/login', payload);
  return res.data;
}

/** GET /auth/me — the logged-in account's own profile (requires bearer token). */
export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get<AuthUser>('/auth/me');
  return res.data;
}
