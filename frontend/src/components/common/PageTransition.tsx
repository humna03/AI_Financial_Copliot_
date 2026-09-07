import { Outlet, useLocation } from 'react-router-dom';

/** Re-keys on pathname so the fade/slide-up entrance animation replays on
 * every navigation, without touching route config or page components. */
export function PageTransition() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      <Outlet />
    </div>
  );
}
