import { useState } from "react";
import { LoaderCircle, Lock, LogIn, Mail } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

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
    <main className="auth-screen">
      <section className="auth-panel" aria-label="Inicio de sesion">
        <div className="brand-mark">P</div>
        <div className="auth-heading">
          <p>Prescript</p>
          <h1>Consulta medica</h1>
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
            <div className="input-shell">
              <Lock size={18} aria-hidden="true" />
              <input
                autoComplete="current-password"
                name="password"
                onChange={handleChange}
                type="password"
                value={form.password}
              />
            </div>
          </label>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            {isSubmitting ? "Ingresando" : "Ingresar"}
          </button>

          <p className="auth-switch">
            Primer ingreso medico. <Link to="/activar-acceso">Crear acceso</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
