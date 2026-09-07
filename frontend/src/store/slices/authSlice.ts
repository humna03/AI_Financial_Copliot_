import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import * as authApi from '../../api/auth.api';
import * as financialUserApi from '../../api/financialUser.api';
import { ApiError } from '../../types/api.types';
import type { AuthUser, Language } from '../../types/auth.types';

const TOKEN_KEY = 'afc_access_token';
const USER_KEY = 'afc_auth_user';
const financialUserMapKey = (email: string) => `afc_financial_user:${email.toLowerCase()}`;

// This local mapping is only a convenience cache for instant reads on the
// very first render (see `initialState` below, before any network call has
// resolved). The backend's GET /auth/me response (`AuthUser.financial_user_id`)
// is the authoritative source of truth once it comes back — see
// `resolveFinancialUserId` — so a cleared/lost/incorrect local cache can
// never cause a wrong or unauthorized financial profile to load; it can at
// most cause one extra `POST /api/users` call, which is itself idempotent.
function readFinancialUserId(email: string): number | null {
  const raw = localStorage.getItem(financialUserMapKey(email));
  return raw ? Number(raw) : null;
}

function writeFinancialUserId(email: string, userId: number) {
  localStorage.setItem(financialUserMapKey(email), String(userId));
}

/** Resolves the financial-profile id for the given (now-authenticated)
 * account, preferring the backend's own answer over the local cache:
 * 1. If GET /auth/me already returned `financial_user_id`, trust it — it was
 *    looked up server-side by the caller's own verified identity.
 * 2. Otherwise (e.g. a legacy account /auth/me hasn't been re-checked for,
 *    or a genuinely new account), create one via POST /api/users — which is
 *    idempotent per account, so this never creates a duplicate even if
 *    called more than once across devices.
 * Either way, the local cache is refreshed so the next page load is instant. */
async function resolveFinancialUserId(
  authUser: AuthUser,
  language: Language
): Promise<number> {
  if (authUser.financial_user_id) {
    writeFinancialUserId(authUser.email, authUser.financial_user_id);
    return authUser.financial_user_id;
  }
  const financialUser = await financialUserApi.createFinancialUser(language);
  writeFinancialUserId(authUser.email, financialUser.user_id);
  return financialUser.user_id;
}

interface AuthState {
  authUser: AuthUser | null;
  token: string | null;
  financialUserId: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const storedUser = localStorage.getItem(USER_KEY);
const initialState: AuthState = {
  authUser: storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
  token: localStorage.getItem(TOKEN_KEY),
  financialUserId: storedUser
    ? readFinancialUserId((JSON.parse(storedUser) as AuthUser).email)
    : null,
  status: 'idle',
  error: null,
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}

/** Sign up (POST /auth/signup), then log in to obtain a token, then resolve the
 * linked financial-profile identity — a brand-new account has none yet, so
 * this creates one (POST /api/users), since the backend has no endpoint that
 * creates both in one call. */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    payload: { full_name: string; email: string; password: string; language: Language },
    { rejectWithValue }
  ) => {
    try {
      await authApi.signup({
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
      });
      const tokenRes = await authApi.login({ email: payload.email, password: payload.password });
      localStorage.setItem(TOKEN_KEY, tokenRes.access_token);
      const authUser = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));

      const financialUserId = await resolveFinancialUserId(authUser, payload.language);

      return { authUser, token: tokenRes.access_token, financialUserId };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  }
);

/** Log in (POST /auth/login), then recover this account's own financial-profile
 * id from the backend (GET /auth/me) — authoritative regardless of what this
 * browser's local cache does or doesn't have. */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const tokenRes = await authApi.login(payload);
      localStorage.setItem(TOKEN_KEY, tokenRes.access_token);
      const authUser = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));

      const financialUserId = await resolveFinancialUserId(authUser, 'en');

      return { authUser, token: tokenRes.access_token, financialUserId };
    } catch (err) {
      return rejectWithValue(errorMessage(err));
    }
  }
);

/** Restore a session on app load from a previously stored token. */
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_: void, { rejectWithValue }) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return rejectWithValue('No stored session');
    try {
      const authUser = await authApi.getMe();
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      const financialUserId = await resolveFinancialUserId(authUser, 'en');
      return { authUser, token, financialUserId };
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return rejectWithValue(errorMessage(err));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      state.authUser = null;
      state.token = null;
      state.financialUserId = null;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<{
        authUser: AuthUser;
        token: string;
        financialUserId: number;
      }>) => {
        state.status = 'succeeded';
        state.authUser = action.payload.authUser;
        state.token = action.payload.token;
        state.financialUserId = action.payload.financialUserId;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Registration failed.';
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.authUser = action.payload.authUser;
        state.token = action.payload.token;
        state.financialUserId = action.payload.financialUserId;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Login failed.';
      })
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.authUser = action.payload.authUser;
        state.token = action.payload.token;
        state.financialUserId = action.payload.financialUserId;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'idle';
        state.authUser = null;
        state.token = null;
        state.financialUserId = null;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
