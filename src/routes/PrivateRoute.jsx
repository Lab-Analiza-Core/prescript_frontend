import { Navigate, useLocation } from "react-router-dom";

import { LoadingTransition } from "../shared/components/LoadingTransition";
import { useAuth } from "../shared/context/useAuth";

export function PrivateRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <main className="loading-screen">
        <LoadingTransition label="Cargando sesion" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
