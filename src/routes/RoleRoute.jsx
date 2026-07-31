import { Navigate } from "react-router-dom";

import { canAccessRoute, firstRouteByRole, normalizeRole } from "../config/accessConfig";
import { useAuth } from "../shared/context/useAuth";

export function RoleRoute({ children, routeKey }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  if (!canAccessRoute(role, routeKey)) {
    return <Navigate to={firstRouteByRole[role] || "/app/agenda"} replace />;
  }

  return children;
}

export function RoleRedirect() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  return <Navigate to={firstRouteByRole[role] || "/app/agenda"} replace />;
}
