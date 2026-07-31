import { useState } from "react";
import { LoaderCircle, Mail, MapPin, Phone, Save, Stethoscope, X } from "lucide-react";

import { updateDoctorProfile } from "../../api/endpoints/doctor";
import { useAuth } from "../context/useAuth";

function getPreferencesText(preferences) {
  if (typeof preferences === "string") return preferences;
  return preferences?.notes || preferences?.summary || "";
}

function ProfileForm({ doctorProfile, onClose, user }) {
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    specialty: doctorProfile.specialties?.[0] || "",
    phone: doctorProfile.phone || "",
    publicEmail: doctorProfile.public_email || doctorProfile.email || user?.email || "",
    preferences: getPreferencesText(doctorProfile.preferences),
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      await updateDoctorProfile({
        phone: form.phone,
        public_email: form.publicEmail,
        specialties: form.specialty.trim() ? [form.specialty.trim()] : [],
        preferences: form.preferences.trim() ? { notes: form.preferences.trim() } : {},
      });
      await refreshUser();
      setSuccessMessage("Perfil actualizado.");
    } catch (error) {
      const detail = error.response?.data?.detail;
      setErrorMessage(detail || "No se pudo guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="modal-form" onSubmit={handleSubmit}>
      <label>
        <span>Especialidad</span>
        <input name="specialty" onChange={handleChange} value={form.specialty} />
      </label>
      <label>
        <span>Telefono</span>
        <div className="input-shell">
          <Phone size={17} aria-hidden="true" />
          <input name="phone" onChange={handleChange} value={form.phone} />
        </div>
      </label>
      <label className="field-wide">
        <span>Correo publico</span>
        <div className="input-shell">
          <Mail size={17} aria-hidden="true" />
          <input name="publicEmail" onChange={handleChange} type="email" value={form.publicEmail} />
        </div>
      </label>
      <label className="field-wide">
        <span>Preferencias</span>
        <textarea name="preferences" onChange={handleChange} rows="4" value={form.preferences} />
      </label>

      {errorMessage ? <p className="form-error field-wide">{errorMessage}</p> : null}
      {successMessage ? <p className="form-success field-wide">{successMessage}</p> : null}

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

  const doctorProfile = user?.doctorProfile || {};

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar perfil" />

      <section className="profile-modal" aria-labelledby="profile-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar">
            <Stethoscope size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Perfil medico</span>
            <h2 id="profile-modal-title">{user?.name || "Doctor"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="profile-summary">
          <span>
            <MapPin size={16} aria-hidden="true" />
            {user?.country || "HN"} - {user?.zone || "Zona"}
          </span>
          <span>{user?.company || "Prescript"}</span>
          {doctorProfile.qualification_code ? <span>{doctorProfile.qualification_code}</span> : null}
        </div>

        <ProfileForm
          key={doctorProfile.updated_at || doctorProfile.id || user?.id}
          doctorProfile={doctorProfile}
          onClose={onClose}
          user={user}
        />
      </section>
    </div>
  );
}
