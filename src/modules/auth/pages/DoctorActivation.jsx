import { useMemo, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, IdCard, LoaderCircle, Mail, Stethoscope, UserCheck, UserRoundCog } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";

const roles = [
  {
    value: "DOCTOR",
    label: "Doctor",
    icon: Stethoscope,
    hint: "Codigo de colegiacion, DNI o correo registrado.",
  },
  {
    value: "NURSE",
    label: "Enfermera",
    icon: UserCheck,
    hint: "Correo, DNI o ID de usuario/empleado en Interactive Core.",
  },
  {
    value: "SECRETARY",
    label: "Secretaria",
    icon: UserRoundCog,
    hint: "ID de secretaria, DNI o correo registrado.",
  },
];

const initialForm = {
  role: "DOCTOR",
  identifier: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

export function DoctorActivation() {
  const { activateAccess, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    passwordConfirm: false,
  });

  const selectedRole = useMemo(
    () => roles.find((role) => role.value === form.role) || roles[0],
    [form.role],
  );

  if (isAuthenticated) {
    return <Navigate to="/app/agenda" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectRole = (role) => {
    setForm((current) => ({ ...current, role }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({
      ...current,
      [fieldName]: !current[fieldName],
    }));
  };

  const getErrorMessage = (error) => {
    const data = error.response?.data;
    if (!data) return "No se pudo crear el acceso. Revise los datos ingresados.";
    if (typeof data.detail === "string") return data.detail;
    if (typeof data === "string") return data;

    const findMessage = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value.map(findMessage).find(Boolean) || "";
      if (typeof value === "object") return Object.values(value).map(findMessage).find(Boolean) || "";
      return "";
    };

    return findMessage(data) || "No se pudo crear el acceso. Revise los datos ingresados.";
  };

  const goNext = () => {
    if (step === 2 && !form.identifier.trim()) {
      showToast("Ingrese el identificador registrado en Interactive Core.", "warning");
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.identifier.trim() || !form.password.trim() || !form.passwordConfirm.trim()) {
      showToast("Complete el identificador y la contrasena.", "warning");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      showToast("Las contrasenas no coinciden.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await activateAccess({
        role: form.role,
        identifier: form.identifier.trim(),
        email: form.email.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      navigate("/app/agenda", { replace: true });
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel auth-panel-wide" aria-label="Creacion de acceso Prescript">
        <div className="brand-mark">P</div>
        <div className="auth-heading">
          <p>Prescript</p>
          <h1>Crear acceso</h1>
          <span>Validamos tu registro en Interactive Core y activamos tu entrada al portal.</span>
        </div>

        <div className="wizard-steps" aria-label="Progreso de creacion de acceso">
          {[1, 2, 3].map((item) => (
            <span className={step >= item ? "active" : ""} key={item} />
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="role-grid">
              {roles.map((role) => {
                const Icon = role.icon;
                const isActive = form.role === role.value;
                return (
                  <button
                    className={isActive ? "role-card active" : "role-card"}
                    key={role.value}
                    onClick={() => selectRole(role.value)}
                    type="button"
                  >
                    <Icon size={22} aria-hidden="true" />
                    <strong>{role.label}</strong>
                    <span>{role.hint}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <label>
              <span>{selectedRole.label}: identificador de Interactive Core</span>
              <div className="input-shell">
                <IdCard size={18} aria-hidden="true" />
                <input
                  autoComplete="username"
                  name="identifier"
                  onChange={handleChange}
                  value={form.identifier}
                />
              </div>
              <small>{selectedRole.hint}</small>
            </label>
          ) : null}

          {step === 3 ? (
            <>
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
                <small>Si lo dejas vacio, se usara el correo registrado en Interactive Core.</small>
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
            </>
          ) : null}

          <div className="wizard-actions">
            {step > 1 ? (
              <button className="secondary-action compact" onClick={goBack} type="button">
                <ChevronLeft size={18} aria-hidden="true" />
                Anterior
              </button>
            ) : null}

            {step < 3 ? (
              <button className="primary-action compact wizard-next" onClick={goNext} type="button">
                Siguiente
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button className="primary-action compact wizard-next" disabled={isSubmitting} type="submit">
                {isSubmitting ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <BadgeCheck size={18} aria-hidden="true" />}
                {isSubmitting ? "Validando" : "Crear acceso"}
              </button>
            )}
          </div>

          <p className="auth-switch">
            Ya tengo acceso. <Link to="/login">Ingresar al portal</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
