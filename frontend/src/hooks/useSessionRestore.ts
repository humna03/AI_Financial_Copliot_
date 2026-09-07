import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { logout, restoreSession } from '../store/slices/authSlice';

/** Restores a session from a stored JWT on load, and reacts to 401 events
 * dispatched by the api client by logging out. */
export function useSessionRestore() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreSession());

    const onUnauthorized = () => dispatch(logout());
    window.addEventListener('afc:unauthorized', onUnauthorized);
    return () => window.removeEventListener('afc:unauthorized', onUnauthorized);
  }, [dispatch]);
}
