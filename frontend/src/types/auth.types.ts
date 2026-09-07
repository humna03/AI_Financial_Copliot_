export type Language = 'en' | 'ur';

/** From POST /auth/signup and GET /auth/me */
export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
  /** The financial-profile `users.id` this account owns, if one has been
   * created yet. Only present on GET /auth/me. The backend looks this up by
   * the caller's own verified identity, so it is always this account's own
   * profile (or null) — never another user's. This is the authoritative
   * source for recovering the financial profile on a new browser/device;
   * the local `afc_financial_user:{email}` mapping is only a convenience
   * cache on top of it. */
  financial_user_id?: number | null;
}

export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** From POST /auth/login */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** From POST /api/users — the "financial profile" identity used by every
 * financial endpoint. The backend's JWT auth (auth_users table) and this
 * financial user_id (users table) are linked server-side via
 * `users.auth_user_id`, and GET /auth/me exposes the caller's own linked id
 * (see AuthUser.financial_user_id) so the frontend doesn't have to rely
 * solely on its local mapping (see authSlice). POST /api/users itself is
 * idempotent per account: calling it again returns the same existing
 * profile rather than creating a duplicate. */
export interface FinancialUser {
  user_id: number;
  language: Language;
}
