import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Building2, CheckCircle2, ChevronLeft, ChevronRight, KeyRound, LoaderCircle, Mail, Search } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { getInvitationInfo, listPublicSpecialties } from "../../../api/endpoints/onboarding";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { applyNumericMask, getCountryFieldFormat, isMaskComplete, maskPlaceholder } from "../../../shared/utils/fieldMasks";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";
import { PasswordInput } from "../components/PasswordInput";
import { useCurrentTerms } from "../hooks/useCurrentTerms";
import { TermsAcceptance } from "../components/TermsAcceptance";

const ROLE_LABELS = {
  DOCTOR: "Doctor",
  SECRETARY: "Secretaria",
  NURSE: "Enfermera",
  PATIENT: "Paciente",
  ORG_ADMIN: "Administrador de organizacion",
};

const DOCUMENT_TYPES = [
  { value: "DNI", label: "Documento de identidad" },
  { value: "PASAPORTE", label: "Pasaporte" },
];

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
  colegiationCode: "",
  sex: "",
  specialtyIds: [],
  documentType: "DNI",
  documentNumber: "",
  acceptTerms: false,
};

export function ExternalRegistration() {
  const { isAuthenticated, registerExternal } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const termsState = useCurrentTerms();
  const [step, setStep] = useState(1);
  const [invitationCode, setInvitationCode] = useState("");
  const [info, setInfo] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, passwordConfirm: false });

  const organization = info?.organization;
  const role = info?.role;
  const countryCode = organization?.country?.code;
  const format = useMemo(() => getCountryFieldFormat(countryCode), [countryCode]);
  const visibleSpecialties = useMemo(() => {
    const term = specialtyFilter.trim().toLowerCase();
    return term ? specialties.filter((specialty) => specialty.name.toLowerCase().includes(term)) : specialties;
  }, [specialties, specialtyFilter]);

  // Las especialidades dependen del pais de la organizacion.
  useEffect(() => {
    if (role !== "DOCTOR" || !countryCode) return undefined;
    let isMounted = true;
    listPublicSpecialties(countryCode)
      .then((rows) => isMounted && setSpecialties(rows))
      .catch(() => isMounted && setSpecialties([]));
    return () => {
      isMounted = false;
    };
  }, [role, countryCode]);

  if (isAuthenticated && !isPending) {
    return <Navigate to="/app" replace />;
  }

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateMasked = (name, mask) => (event) => {
    const value = applyNumericMask(event.target.value, mask);
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleSpecialty = (id) => {
    setForm((current) => ({
      ...current,
      specialtyIds: current.specialtyIds.includes(id)
        ? current.specialtyIds.filter((item) => item !== id)
        : [...current.specialtyIds, id],
    }));
  };

  const validateCode = async () => {
    const code = invitationCode.trim();
    if (!code) {
      showToast("Ingrese el codigo de invitacion.", "warning");
      return;
    }
    setIsValidating(true);
    try {
      setInfo(await getInvitationInfo(code));
      setStep(2);
    } catch (error) {
      showToast(getApiErrorMessage(error, "El codigo de invitacion no es valido."), "error");
    } finally {
      setIsValidating(false);
    }
  };

  const validateDetails = () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      return "Complete su nombre y correo.";
    }
    if (form.phone && !isMaskComplete(form.phone, format.phoneMask)) {
      return `El telefono debe seguir el formato ${format.phoneMask}.`;
    }
    if (form.password.length < 8) return "La contrasena debe tener al menos 8 caracteres.";
    if (form.password !== form.passwordConfirm) return "Las contrasenas no coinciden.";
    if (role === "DOCTOR" && !form.colegiationCode.trim()) return "Ingrese su codigo de colegiacion.";
    if (role === "PATIENT" && !form.documentNumber.trim()) return "Ingrese su numero de documento.";
    return "";
  };

  const goToTerms = () => {
    const problem = validateDetails();
    if (problem) {
      showToast(problem, "warning");
      return;
    }
    setStep(3);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.acceptTerms) {
      showToast("Debe aceptar los terminos y condiciones.", "warning");
      return;
    }

    const payload = {
      role,
      invitation_code: invitationCode.trim(),
      full_name: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone,
      password: form.password,
      password_confirm: form.passwordConfirm,
      country: countryCode,
      accept_terms: true,
    };
    if (role === "DOCTOR") {
      payload.colegiation_code = form.colegiationCode.trim();
      payload.specialty_ids = form.specialtyIds;
      if (form.sex) payload.sex = form.sex;
    }
    if (role === "PATIENT") {
      payload.document_type = form.documentType;
      payload.document_number = form.documentNumber.trim();
    }

    setIsSubmitting(true);
    try {
      const result = await registerExternal(payload);
      if (result.pending_approval) {
        setIsPending(true);
      } else {
        navigate("/app", { replace: true });
      }
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo crear la cuenta."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <main className="auth-screen">
        <section className="auth-panel auth-panel-wide" aria-label="Solicitud enviada">
          <div className="brand-mark">P</div>
          <div className="pending-state">
            <CheckCircle2 size={34} aria-hidden="true" />
            <h1>Solicitud enviada</h1>
            <p>
              Su cuenta de administrador de <strong>{organization?.name}</strong> debe ser aprobada por el
              administrador global. Le avisaremos por correo cuando pueda ingresar.
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
      <section className="auth-panel auth-panel-wide" aria-label="Registro con codigo de invitacion">
        <div className="brand-mark">P</div>
        <div className="auth-heading">
          <p>Prescript</p>
          <h1>Registro con invitacion</h1>
          <span>Su organizacion le entrego un codigo para crear su cuenta.</span>
        </div>

        <div className="wizard-steps" aria-label="Progreso del registro">
          {[1, 2, 3].map((item) => (
            <span className={step >= item ? "active" : ""} key={item} />
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {step === 1 ? (
            <label>
              <span>Codigo de invitacion</span>
              <div className="input-shell">
                <KeyRound size={18} aria-hidden="true" />
                <input
                  autoCapitalize="characters"
                  autoComplete="off"
                  onChange={(event) => setInvitationCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      validateCode();
                    }
                  }}
                  placeholder="XXXXX-XXXXX"
                  value={invitationCode}
                />
              </div>
              <small>El codigo define su rol y su organizacion.</small>
            </label>
          ) : null}

          {step >= 2 && organization ? (
            <div className="org-summary">
              <Building2 size={20} aria-hidden="true" />
              <div>
                <strong>{organization.name}</strong>
                <small>
                  {[
                    organization.country.name,
                    organization.division && `${organization.division_type}: ${organization.division}`,
                    organization.medical_area,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>
              <span className="role-badge">{ROLE_LABELS[role] || role}</span>
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <label>
                <span>Nombre completo</span>
                <div className="input-shell">
                  <input autoComplete="name" name="fullName" onChange={updateField} value={form.fullName} />
                </div>
              </label>

              <div className="auth-grid">
                <label>
                  <span>Correo</span>
                  <div className="input-shell">
                    <Mail size={18} aria-hidden="true" />
                    <input autoComplete="email" name="email" onChange={updateField} type="email" value={form.email} />
                  </div>
                </label>
                <label>
                  <span>Telefono ({format.phoneCode})</span>
                  <div className="input-shell">
                    <input
                      autoComplete="tel-national"
                      inputMode="numeric"
                      onChange={updateMasked("phone", format.phoneMask)}
                      placeholder={maskPlaceholder(format.phoneMask)}
                      value={form.phone}
                    />
                  </div>
                </label>
              </div>

              {role === "DOCTOR" ? (
                <>
                  <div className="auth-grid">
                    <label>
                      <span>Codigo de colegiacion</span>
                      <div className="input-shell">
                        <input name="colegiationCode" onChange={updateField} value={form.colegiationCode} />
                      </div>
                    </label>
                    <label>
                      <span>Sexo</span>
                      <div className="input-shell">
                        <select name="sex" onChange={updateField} value={form.sex}>
                          <option value="">Sin indicar</option>
                          <option value="F">Femenino</option>
                          <option value="M">Masculino</option>
                          <option value="O">Otro</option>
                        </select>
                      </div>
                    </label>
                  </div>

                  <div className="field-group">
                    <span className="field-group-label">
                      Especialidades ({organization.country.name})
                      {form.specialtyIds.length ? <small> · {form.specialtyIds.length} seleccionada(s)</small> : null}
                    </span>
                    {specialties.length ? (
                      <>
                        <div className="input-shell">
                          <Search size={16} aria-hidden="true" />
                          <input
                            aria-label="Filtrar especialidades"
                            onChange={(event) => setSpecialtyFilter(event.target.value)}
                            placeholder="Filtrar especialidades"
                            type="search"
                            value={specialtyFilter}
                          />
                        </div>
                        <div className="user-role-grid specialty-picker" role="group" aria-label="Especialidades">
                          {visibleSpecialties.map((specialty) => (
                          <label
                            className={form.specialtyIds.includes(specialty.id) ? "role-chip selected" : "role-chip"}
                            key={specialty.id}
                          >
                            <input
                              checked={form.specialtyIds.includes(specialty.id)}
                              onChange={() => toggleSpecialty(specialty.id)}
                              type="checkbox"
                            />
                            <span>{specialty.name}</span>
                          </label>
                          ))}
                          {!visibleSpecialties.length ? <small>Sin coincidencias.</small> : null}
                        </div>
                      </>
                    ) : (
                      <small>No hay especialidades disponibles para este pais.</small>
                    )}
                  </div>
                </>
              ) : null}

              {role === "PATIENT" ? (
                <div className="auth-grid">
                  <label>
                    <span>Tipo de documento</span>
                    <div className="input-shell">
                      <select name="documentType" onChange={updateField} value={form.documentType}>
                        {DOCUMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label>
                    <span>Numero de documento</span>
                    <div className="input-shell">
                      <input
                        inputMode={form.documentType === "DNI" ? "numeric" : "text"}
                        name="documentNumber"
                        onChange={
                          form.documentType === "DNI" && format.dniMask
                            ? updateMasked("documentNumber", format.dniMask)
                            : updateField
                        }
                        placeholder={form.documentType === "DNI" ? maskPlaceholder(format.dniMask) : ""}
                        value={form.documentNumber}
                      />
                    </div>
                  </label>
                </div>
              ) : null}

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
            </>
          ) : null}

          {step === 3 ? (
            <TermsAcceptance
              accepted={form.acceptTerms}
              onChange={(accepted) => setForm((current) => ({ ...current, acceptTerms: accepted }))}
              state={termsState}
            />
          ) : null}

          <div className="wizard-actions">
            {step > 1 ? (
              <button className="secondary-action compact" onClick={() => setStep(step - 1)} type="button">
                <ChevronLeft size={18} aria-hidden="true" />
                Anterior
              </button>
            ) : null}

            {step === 1 ? (
              <button className="primary-action compact wizard-next" disabled={isValidating} onClick={validateCode} type="button">
                {isValidating ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : null}
                {isValidating ? "Validando" : "Siguiente"}
                {!isValidating ? <ChevronRight size={18} aria-hidden="true" /> : null}
              </button>
            ) : null}

            {step === 2 ? (
              <button className="primary-action compact wizard-next" onClick={goToTerms} type="button">
                Siguiente
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ) : null}

            {step === 3 ? (
              <button
                className="primary-action compact wizard-next"
                disabled={isSubmitting || termsState.status !== "ready"}
                type="submit"
              >
                {isSubmitting ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <BadgeCheck size={18} aria-hidden="true" />}
                {isSubmitting ? "Creando" : "Crear cuenta"}
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
