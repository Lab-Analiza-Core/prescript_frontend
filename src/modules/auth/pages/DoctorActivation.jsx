import { useState } from "react";
import { BadgeCheck, IdCard, LoaderCircle, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../../../shared/context/useAuth";

export function DoctorActivation() {
  const { activateDoctor, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    passwordConfirm: false,
  });

  if (isAuthenticated) {
    return <Navigate to="/app/agenda" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const getErrorMessage = (error) => {
    const data = error.response?.data;
    if (!data) return "No se pudo activar el acceso. Revise los datos ingresados.";
    if (typeof data.detail === "string") return data.detail;
    if (typeof data === "string") return data;

    const findMessage = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        return value.map(findMessage).find(Boolean) || "";
      }
      if (typeof value === "object") {
        return Object.values(value).map(findMessage).find(Boolean) || "";
      }
      return "";
    };

    return findMessage(data) || "No se pudo activar el acceso. Revise los datos ingresados.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!form.identifier.trim() || !form.password.trim() || !form.passwordConfirm.trim()) {
      setErrorMessage("Complete el identificador y la contrasena.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setErrorMessage("Las contrasenas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateDoctor({
        identifier: form.identifier.trim(),
        email: form.email.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      navigate("/app/agenda", { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel auth-panel-wide" aria-label="Activacion de acceso medico">
        <div className="brand-mark">P</div>
        <div className="auth-heading">
          <p>Prescript</p>
          <h1>Activar acceso medico</h1>
          <span>Validamos tu registro clinico y dejamos lista la entrada al portal.</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Codigo, colegiacion o correo registrado</span>
            <div className="input-shell">
              <IdCard size={18} aria-hidden="true" />
              <input
                autoComplete="username"
                name="identifier"
                onChange={handleChange}
                value={form.identifier}
              />
            </div>
          </label>

          <label>
            <span>Correo de acceso</span>
            <div className="input-shell">
              <Mail size={18} aria-hidden="true" />
              <input
                autoComplete="email"
                name="email"
                onChange={handleChange}
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <div className="auth-grid">
            <label>
              <span>Contrasena</span>
              <PasswordInput
                autoComplete="new-password"
                isVisible={visiblePasswords.password}
                name="password"
                onChange={handleChange}
                onToggleVisibility={() => togglePasswordVisibility("password")}
                value={form.password}
              />
            </label>

            <label>
              <span>Confirmar</span>
              <PasswordInput
                autoComplete="new-password"
                isVisible={visiblePasswords.passwordConfirm}
                name="passwordConfirm"
                onChange={handleChange}
                onToggleVisibility={() => togglePasswordVisibility("passwordConfirm")}
                value={form.passwordConfirm}
              />
            </label>
          </div>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button className="primary-action" disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <BadgeCheck size={18} aria-hidden="true" />}
            {isSubmitting ? "Validando" : "Crear acceso"}
          </button>

          <p className="auth-switch">
            Ya tengo acceso. <Link to="/login">Ingresar al portal</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
