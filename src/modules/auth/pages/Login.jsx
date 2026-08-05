import { useState } from "react";
import { LoaderCircle, LogIn, Mail } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../../../shared/context/useAuth";

export function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/app/agenda";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!form.email.trim() || !form.password.trim()) {
      setErrorMessage("Ingrese usuario y contrasena.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const detail = error.response?.data?.detail;
      setErrorMessage(detail || "No se pudo iniciar sesion. Revise sus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen auth-screen-login">
      <div className="auth-ledger" aria-hidden="true">
        <span>RX</span>
        <span>08:30</span>
        <span>TRIAGE</span>
      </div>
      <div className="auth-login-stage">
        <section className="login-identity" aria-hidden="true" />

        <section className="auth-panel login-auth-panel" aria-label="Inicio de sesion">
          <div className="login-auth-content">
            <div className="login-brand-title">
              <div className="brand-mark">Rx</div>
              <span>Prescript</span>
            </div>

            <div className="auth-heading">
              <h1>Iniciar sesion</h1>
              <span>Tu escritorio clinico para agenda, preclinica y recetas.</span>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                <span>Correo o usuario</span>
                <div className="input-shell">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    autoComplete="username"
                    name="email"
                    onChange={handleChange}
                    type="text"
                    value={form.email}
                  />
                </div>
              </label>

              <label>
                <span>Contrasena</span>
                <PasswordInput
                  autoComplete="current-password"
                  isVisible={isPasswordVisible}
                  name="password"
                  onChange={handleChange}
                  onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
                  value={form.password}
                />
              </label>

              {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

              <button className="primary-action login-action" disabled={isSubmitting} type="submit">
                {isSubmitting ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
                {isSubmitting ? "Ingresando" : "Entrar"}
              </button>

              <p className="auth-switch">
                Primer ingreso medico. <Link to="/activar-acceso">Crear acceso</Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
