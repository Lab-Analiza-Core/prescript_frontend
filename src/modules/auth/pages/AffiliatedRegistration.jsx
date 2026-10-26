import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MailCheck,
  Stethoscope,
  UserCheck,
  UserRoundCog,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { requestAffiliationCode } from "../services/registrationService";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { applyNumericMask, getCountryFieldFormat, maskPlaceholder } from "../../../shared/utils/fieldMasks";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";
import { AffiliationCombobox } from "../components/AffiliationCombobox";
import { PasswordInput } from "../components/PasswordInput";
import { useCurrentTerms } from "../hooks/useCurrentTerms";
import { TermsAcceptance } from "../components/TermsAcceptance";

const RESEND_SECONDS = 60;
const MODE_MANUAL_REVIEW = "manual_review";

const ROLES = [
  {
    value: "DOCTOR",
    label: "Doctor",
    icon: Stethoscope,
    hint: "Busque su nombre o codigo de colegiacion.",
    searchLabel: "Busque su nombre o codigo de colegiacion",
    placeholder: "Nombre o codigo de colegiacion",
  },
  {
    value: "NURSE",
    label: "Enfermera",
    icon: UserCheck,
    hint: "Busque su nombre o documento.",
    searchLabel: "Busque su nombre o documento",
    placeholder: "Nombre o documento",
  },
  {
    value: "SECRETARY",
    label: "Secretaria",
    icon: UserRoundCog,
    hint: "Busque su nombre o documento.",
    searchLabel: "Busque su nombre o documento",
    placeholder: "Nombre o documento",
  },
];

const initialForm = { code: "", password: "", passwordConfirm: "", acceptTerms: false };

export function AffiliatedRegistration() {
  const { activateAffiliation, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const termsState = useCurrentTerms();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("DOCTOR");
  // Ficha de Interactive Core elegida en el combobox.
  const [person, setPerson] = useState(null);
  // La ficha no tiene correo: la persona indica el suyo y un administrador revisa la solicitud.
  const [needsOwnEmail, setNeedsOwnEmail] = useState(false);
  const [ownEmail, setOwnEmail] = useState("");
  const [ownPhone, setOwnPhone] = useState("");
  const [mode, setMode] = useState("verified");
  const [emailHint, setEmailHint] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, passwordConfirm: false });

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  if (isAuthenticated && !isPending) {
    return <Navigate to="/app" replace />;
  }

  const roleConfig = ROLES.find((item) => item.value === role);
  const RoleIcon = roleConfig.icon;
  const isManualReview = mode === MODE_MANUAL_REVIEW;
  const phoneFormat = getCountryFieldFormat(person?.country_code);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectRole = (nextRole) => {
    if (nextRole === role) return;
    setRole(nextRole);
    // Las fichas son de otro catalogo: la eleccion anterior ya no aplica.
    setPerson(null);
    setNeedsOwnEmail(false);
  };

  const selectPerson = (selected) => {
    setPerson(selected);
    // has_email === null: la API no lo informa y lo resuelve el backend al pedir el codigo.
    setNeedsOwnEmail(selected.has_email === false);
  };

  const sendCode = async () => {
    if (!person) return;
    if (needsOwnEmail && !ownEmail.trim()) {
      showToast("Indique su correo para recibir el codigo.", "warning");
      return;
    }
    setIsSending(true);
    try {
      const result = await requestAffiliationCode(role, person.id, needsOwnEmail ? ownEmail.trim() : undefined);
      setMode(result.mode);
      setEmailHint(result.email_hint);
      setSecondsLeft(RESEND_SECONDS);
      setStep(3);
      showToast("Codigo enviado.", "success");
    } catch (error) {
      if (error.response?.data?.requires_own_email) {
        setNeedsOwnEmail(true);
      }
      showToast(getApiErrorMessage(error, "No se pudo enviar el codigo."), "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(form.code.trim())) {
      showToast("Ingrese el codigo de 6 digitos que recibio por correo.", "warning");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      showToast("Las contrasenas no coinciden.", "warning");
      return;
    }
    if (!form.acceptTerms) {
      showToast("Debe aceptar los terminos y condiciones.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await activateAffiliation({
        role,
        profileId: person.id,
        code: form.code.trim(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        acceptTerms: form.acceptTerms,
        email: isManualReview ? ownEmail.trim() : undefined,
        phone: isManualReview ? ownPhone : undefined,
      });
      if (result.pending_review) {
        setIsPending(true);
      } else {
        navigate("/app", { replace: true });
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo crear el acceso."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <main className="auth-screen">
        <section className="auth-panel auth-panel-wide" aria-label="Solicitud en revision">
          <div className="brand-mark">P</div>
          <div className="pending-state">
            <CheckCircle2 size={34} aria-hidden="true" />
            <h1>Solicitud en revision</h1>
            <p>
              Verificamos su correo. Un administrador de Interactive Core debe confirmar que usted es{" "}
              <strong>{person?.full_name}</strong> antes de darle acceso. Le avisaremos a <strong>{ownEmail}</strong>{" "}
              cuando este lista.
            </p>
            <Link className="primary-action compact" to="/login">
              Ir al inicio de sesion
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel auth-panel-wide" aria-label="Registro de afiliado a Interactive Core">
        <div className="brand-mark">P</div>
        <div className="auth-heading">
          <p>Prescript</p>
          <h1>Afiliado a Interactive Core</h1>
          <span>Confirmamos su identidad antes de vincular su cuenta con su ficha.</span>
        </div>

        <div className="wizard-steps" aria-label="Progreso del registro">
          {[1, 2, 3].map((item) => (
            <span className={step >= item ? "active" : ""} key={item} />
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="role-grid">
              {ROLES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={role === item.value ? "role-card active" : "role-card"}
                    key={item.value}
                    onClick={() => selectRole(item.value)}
                    type="button"
                  >
                    <Icon size={22} aria-hidden="true" />
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <label className="combobox-label">
                <span>{roleConfig.searchLabel}</span>
              </label>
              <AffiliationCombobox key={role} onSelect={selectPerson} placeholder={roleConfig.placeholder} role={role} />

              {person ? (
                <div className="selected-doctor" role="status">
                  <RoleIcon size={20} aria-hidden="true" />
                  <div>
                    <strong>{person.full_name}</strong>
                    <small>
                      {[person.country_code, person.identifier_hint && `${person.identifier_label} ${person.identifier_hint}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                </div>
              ) : (
                <small>Seleccione su nombre en la lista para continuar.</small>
              )}

              {person && needsOwnEmail ? (
                <>
                  <div className="form-notice" role="note">
                    <CircleAlert size={18} aria-hidden="true" />
                    <p>
                      Su ficha en Interactive Core no tiene un correo registrado. Indique el suyo: le enviaremos un
                      codigo y, al verificarlo, un administrador revisara su solicitud antes de darle acceso.
                    </p>
                  </div>
                  <div className="auth-grid">
                    <label>
                      <span>Su correo</span>
                      <div className="input-shell">
                        <Mail size={18} aria-hidden="true" />
                        <input
                          autoComplete="email"
                          onChange={(event) => setOwnEmail(event.target.value)}
                          type="email"
                          value={ownEmail}
                        />
                      </div>
                    </label>
                    <label>
                      <span>Telefono de contacto (opcional)</span>
                      <div className="input-shell">
                        <input
                          autoComplete="tel-national"
                          inputMode="numeric"
                          onChange={(event) => setOwnPhone(applyNumericMask(event.target.value, phoneFormat.phoneMask))}
                          placeholder={maskPlaceholder(phoneFormat.phoneMask)}
                          value={ownPhone}
                        />
                      </div>
                      <small>Ayuda al administrador a confirmar su identidad.</small>
                    </label>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="form-success" role="status">
                <MailCheck size={16} aria-hidden="true" /> Enviamos un codigo a {emailHint}. Vence en 10 minutos.
                {isManualReview ? " Al verificarlo, un administrador revisara su solicitud." : ""}
              </div>

              <label>
                <span>Codigo de verificacion</span>
                <div className="input-shell">
                  <input
                    autoComplete="one-time-code"
                    className="code-input"
                    inputMode="numeric"
                    maxLength={6}
                    name="code"
                    onChange={updateField}
                    placeholder="000000"
                    value={form.code}
                  />
                </div>
                <small>
                  {secondsLeft > 0 ? (
                    `Podra pedir otro codigo en ${secondsLeft} s.`
                  ) : (
                    <button className="link-action" disabled={isSending} onClick={sendCode} type="button">
                      Reenviar codigo
                    </button>
                  )}
                </small>
              </label>

              <div className="auth-grid">
                <label>
                  <span>Contrasena</span>
                  <PasswordInput
                    autoComplete="new-password"
                    isVisible={visiblePasswords.password}
                    name="password"
                    onChange={updateField}
                    onToggleVisibility={() => setVisiblePasswords((current) => ({ ...current, password: !current.password }))}
                    value={form.password}
                  />
                </label>
                <label>
                  <span>Confirmar</span>
                  <PasswordInput
                    autoComplete="new-password"
                    isVisible={visiblePasswords.passwordConfirm}
                    name="passwordConfirm"
                    onChange={updateField}
                    onToggleVisibility={() =>
                      setVisiblePasswords((current) => ({ ...current, passwordConfirm: !current.passwordConfirm }))
                    }
                    value={form.passwordConfirm}
                  />
                </label>
              </div>

              <TermsAcceptance
                accepted={form.acceptTerms}
                onChange={(accepted) => setForm((current) => ({ ...current, acceptTerms: accepted }))}
                state={termsState}
              />
            </>
          ) : null}

          <div className="wizard-actions">
            {step > 1 ? (
              <button className="secondary-action compact" onClick={() => setStep(step - 1)} type="button">
                <ChevronLeft size={18} aria-hidden="true" />
                Anterior
              </button>
            ) : null}

            {step === 1 ? (
              <button className="primary-action compact wizard-next" onClick={() => setStep(2)} type="button">
                Siguiente
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : null}

            {step === 2 ? (
              <button className="primary-action compact wizard-next" disabled={!person || isSending} onClick={sendCode} type="button">
                {isSending ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <MailCheck size={18} aria-hidden="true" />}
                {isSending ? "Enviando" : "Enviar codigo"}
              </button>
            ) : null}

            {step === 3 ? (
              <button
                className="primary-action compact wizard-next"
                disabled={isSubmitting || termsState.status !== "ready"}
                type="submit"
              >
                {isSubmitting ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <BadgeCheck size={18} aria-hidden="true" />}
                {isSubmitting ? "Validando" : isManualReview ? "Enviar solicitud" : "Crear acceso"}
              </button>
            ) : null}
          </div>

          <p className="auth-switch">
            Ya tengo acceso. <Link to="/login">Ingresar al portal</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
