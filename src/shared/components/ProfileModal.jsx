import { useState } from "react";
import { LoaderCircle, Mail, MapPin, Phone, Save, Stethoscope, UserRound, X } from "lucide-react";

import { updateMeRequest } from "../../api/endpoints/auth";
import { updateDoctorProfile } from "../../api/endpoints/doctor";
import { PasswordInput } from "../../modules/auth/components/PasswordInput";
import { useToast } from "../context/useToast";
import { useAuth } from "../context/useAuth";

const ROLE_LABELS = {
  DOCTOR: "Doctor",
  NURSE: "Enfermera",
  SECRETARY: "Secretaria",
  ADMIN: "Admin",
  COUNTRY_MANAGER: "Gerente",
};

function getPreferencesText(preferences) {
  if (typeof preferences === "string") return preferences;
  return preferences?.notes || preferences?.summary || "";
}

function getActiveProfile(user) {
  return user?.doctorProfile || user?.secretaryProfile || user?.nurseProfile || {};
}

function getSpecialtyLabel(specialty) {
  if (!specialty) return "";
  if (typeof specialty === "string") return specialty;
  if (typeof specialty === "object") {
    return specialty.name || specialty.description || specialty.label || specialty.code || "";
  }
  return String(specialty);
}

function getSpecialtyTags(specialties) {
  if (!Array.isArray(specialties)) return [];
  return specialties.map(getSpecialtyLabel).filter(Boolean);
}

function getErrorMessage(error) {
  const data = error.response?.data;
  if (!data) return "No se pudo guardar el perfil.";
  if (typeof data.detail === "string") return data.detail;

  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];
  if (Array.isArray(firstValue)) return firstValue[0];
  if (typeof firstValue === "string") return firstValue;
  return "No se pudo guardar el perfil.";
}

function ProfileForm({ activeProfile, isDoctor, onClose, user }) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const [visiblePasswords, setVisiblePasswords] = useState({
    newPassword: false,
    passwordConfirm: false,
  });
  const [form, setForm] = useState({
    phone: activeProfile.phone || "",
    email: activeProfile.public_email || activeProfile.email || user?.email || "",
    preferences: getPreferencesText(user?.doctorProfile?.preferences),
    newPassword: "",
    passwordConfirm: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const passwordPayload =
      form.newPassword || form.passwordConfirm
        ? {
            new_password: form.newPassword,
            password_confirm: form.passwordConfirm,
          }
        : {};

    try {
      await updateMeRequest({
        phone: form.phone,
        email: form.email,
        ...passwordPayload,
      });

      if (isDoctor) {
        await updateDoctorProfile({
          phone: form.phone,
          public_email: form.email,
          preferences: form.preferences.trim() ? { notes: form.preferences.trim() } : {},
        });
      }

      await refreshUser();
      setForm((current) => ({
        ...current,
        newPassword: "",
        passwordConfirm: "",
      }));
      showToast("Perfil actualizado.", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const specialtyTags = getSpecialtyTags(user?.doctorProfile?.specialties);

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      {isDoctor ? (
        <label className="field-wide">
          <span>Especialidad</span>
          <div className="readonly-tag-field" aria-readonly="true">
            <Stethoscope size={17} aria-hidden="true" />
            <div className="specialty-tags">
              {specialtyTags.length ? specialtyTags.map((specialty) => <span key={specialty}>{specialty}</span>) : <span>Sin especialidad registrada</span>}
            </div>
          </div>
        </label>
      ) : null}

      <label>
        <span>Telefono</span>
        <div className="input-shell">
          <Phone size={17} aria-hidden="true" />
          <input autoComplete="tel" name="phone" onChange={handleChange} value={form.phone} />
        </div>
      </label>

      <label className="field-wide">
        <span>Correo de acceso</span>
        <div className="input-shell">
          <Mail size={17} aria-hidden="true" />
          <input autoComplete="email" name="email" onChange={handleChange} type="email" value={form.email} />
        </div>
      </label>

      {isDoctor ? (
        <label className="field-wide">
          <span>Preferencias</span>
          <textarea name="preferences" onChange={handleChange} rows="4" value={form.preferences} />
        </label>
      ) : null}

      <div className="profile-form-section field-wide">
        <span>Contrasena</span>
      </div>

      <label>
        <span>Nueva contrasena</span>
        <PasswordInput
          autoComplete="new-password"
          isVisible={visiblePasswords.newPassword}
          name="newPassword"
          onChange={handleChange}
          onToggleVisibility={() => togglePasswordVisibility("newPassword")}
          value={form.newPassword}
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

      <div className="modal-actions">
        <button className="secondary-action compact" onClick={onClose} type="button">
          Cancelar
        </button>
        <button className="primary-action compact" disabled={isSaving} type="submit">
          {isSaving ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
          {isSaving ? "Guardando" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export function ProfileModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  const activeProfile = getActiveProfile(user);
  const isDoctor = Boolean(user?.doctorProfile);
  const roleLabel = ROLE_LABELS[user?.role] || user?.roleLabel || "Usuario";

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar perfil" />

      <section className="profile-modal" aria-labelledby="profile-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar">
            <UserRound size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Perfil de usuario</span>
            <h2 id="profile-modal-title">{user?.name || activeProfile.full_name || "Usuario"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="profile-summary">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {user?.country || "HN"} - {user?.zone || "Centro"}
          </span>
          <span>{roleLabel}</span>
          <span>{user?.company || "Prescript"}</span>
          {user?.doctorProfile?.qualification_code ? <span>{user.doctorProfile.qualification_code}</span> : null}
        </div>

        <ProfileForm
          key={`${activeProfile.updated_at || activeProfile.id || user?.id}-${user?.email}`}
          activeProfile={activeProfile}
          isDoctor={isDoctor}
          onClose={onClose}
          user={user}
        />
      </section>
    </div>
  );
}
