import { Building2, KeyRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../../../shared/context/useAuth";

export function RegisterChoice() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel auth-panel-wide" aria-label="Crear cuenta en Prescript">
        <div className="brand-mark">P</div>
        <div className="auth-heading">
          <p>Prescript</p>
          <h1>Crear cuenta</h1>
          <span>Elija como desea ingresar al portal.</span>
        </div>

        <div className="role-grid role-grid-two">
          <button className="role-card" onClick={() => navigate("/registro/afiliado")} type="button">
            <Building2 size={22} aria-hidden="true" />
            <strong>Afiliado a Interactive Core</strong>
            <span>Soy doctor, enfermera o secretaria registrado en Interactive Core.</span>
          </button>
          <button className="role-card" onClick={() => navigate("/registro/externo")} type="button">
            <KeyRound size={22} aria-hidden="true" />
            <strong>No afiliado</strong>
            <span>Tengo un codigo de invitacion de mi organizacion, clinica o paciente.</span>
          </button>
        </div>

        <p className="auth-switch">
          Ya tengo acceso. <Link to="/login">Ingresar al portal</Link>
        </p>
      </section>
    </main>
  );
}
