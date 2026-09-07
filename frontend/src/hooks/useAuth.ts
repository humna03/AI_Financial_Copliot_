import { useAppSelector } from '../store/hooks';

export function useAuth() {
  const { authUser, token, financialUserId, status, error } = useAppSelector((s) => s.auth);
  return {
    authUser,
    token,
    financialUserId,
    isAuthenticated: Boolean(token && authUser),
    isLoading: status === 'loading',
    error,
  };
}
