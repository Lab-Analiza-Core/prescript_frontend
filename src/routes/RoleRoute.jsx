import { Navigate } from "react-router-dom";

import { canAccessRoute, firstRouteByRole, normalizeRole } from "../config/accessConfig";
import { useAuth } from "../shared/context/useAuth";

function MissingRoleNotice() {
  return (
    <section className="empty-state" role="alert">
      <h1>Acceso no disponible</h1>
      <p>Tu cuenta no tiene un rol reconocido. Cierra la sesion y contacta al administrador.</p>
    </section>
  );
}

export function RoleRoute({ children, routeKey }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const fallbackRoute = firstRouteByRole[role];

  if (!fallbackRoute) {
    return <MissingRoleNotice />;
  }

  if (!canAccessRoute(role, routeKey, { isGlobalAdmin: Boolean(user?.isGlobalAdmin) })) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
}

export function RoleRedirect() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const firstRoute = firstRouteByRole[role];

  return firstRoute ? <Navigate to={firstRoute} replace /> : <MissingRoleNotice />;
}
