import { Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { getCountryCode } from "../../../shared/utils/countryUtils";
import {
  applyNumericMask,
  getCountryFieldFormat,
  isMaskComplete,
  maskPlaceholder,
  stripPhoneCountryCode,
} from "../../../shared/utils/fieldMasks";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const emptyForm = {
  doctor: "",
  first_name: "",
  last_name: "",
  dni: "",
  phone: "",
  email: "",
  birth_date: "",
  sex: "",
  commercial_notes: "",
};

const getInitialForm = (patient) => ({
  doctor: patient?.doctor || "",
  first_name: patient?.first_name || "",
  last_name: patient?.last_name || "",
  dni: patient?.dni || "",
  phone: patient?.phone || "",
  email: patient?.email || "",
  birth_date: patient?.birth_date || "",
  sex: patient?.sex || "",
  commercial_notes: patient?.commercial_notes || "",
});

const getErrorMessage = (error) => {
  const detail = error.response?.data;
  if (!detail) return "No se pudo guardar el paciente. Revise los datos.";
  if (typeof detail === "string") return detail;
  if (typeof detail.detail === "string") return detail.detail;

  const firstKey = Object.keys(detail)[0];
  const firstValue = detail[firstKey];
  if (Array.isArray(firstValue)) return `${firstKey}: ${firstValue[0]}`;
  if (typeof firstValue === "string") return `${firstKey}: ${firstValue}`;
  return "No se pudo guardar el paciente. Revise los datos.";
};

const getDuplicateConfirmationMessage = (error) => {
  const detail = error.response?.data?.confirm_duplicate;
  if (Array.isArray(detail)) return detail[0] || "";
  return typeof detail === "string" ? detail : "";
};

export function PatientModal({ country = "HN", doctorOptions = [], isOpen, mode, onClose, onSubmit, patient, requiresDoctor = false }) {
  const [form, setForm] = useState(() => (isOpen ? getInitialForm(patient) : emptyForm));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [requiresDuplicateConfirmation, setRequiresDuplicateConfirmation] = useState(false);

  const title = useMemo(() => (mode === "edit" ? "Modificar paciente" : "Nuevo paciente"), [mode]);
  const selectedDoctor = doctorOptions.find((doctor) => String(doctor.id) === String(form.doctor));
  const fieldFormat = useMemo(
    () => getCountryFieldFormat(selectedDoctor?.country || country),
    [country, selectedDoctor?.country],
  );
  // Guatemala: basta con DNI o telefono. Resto de paises: ambos obligatorios.
  const contactEither = (getCountryCode(selectedDoctor?.country || country) || "HN") === "GT";
  const contactLabel = contactEither ? " (DNI o telefono *)" : " *";
  const dniPlaceholder = useMemo(() => maskPlaceholder(fieldFormat.dniMask), [fieldFormat.dniMask]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setRequiresDuplicateConfirmation(false);
  };

  const handleDniChange = (event) => {
    setForm((current) => ({
      ...current,
      dni: applyNumericMask(event.target.value, fieldFormat.dniMask),
    }));
    setRequiresDuplicateConfirmation(false);
  };

  const handlePhoneChange = (event) => {
    setForm((current) => ({
      ...current,
      phone: applyNumericMask(
        stripPhoneCountryCode(event.target.value, fieldFormat.phoneCode),
        fieldFormat.phoneMask,
      ),
    }));
    setRequiresDuplicateConfirmation(false);
  };

  const buildPayload = () => {
    if (contactEither) {
      if (!form.dni.trim() && !form.phone.trim()) throw new Error("Ingrese el DNI o el telefono del paciente.");
    } else {
      if (!form.dni.trim()) throw new Error("El DNI es obligatorio.");
      if (!form.phone.trim()) throw new Error("El telefono es obligatorio.");
    }
    if (form.dni && !isMaskComplete(form.dni, fieldFormat.dniMask)) {
      throw new Error(`El DNI debe seguir el formato ${fieldFormat.dniMask}.`);
    }
    if (form.phone && !isMaskComplete(form.phone, fieldFormat.phoneMask)) {
      throw new Error(`El telefono debe seguir el formato ${fieldFormat.phoneMask}.`);
    }

    const payload = {
      ...form,
      dni: form.dni.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      birth_date: form.birth_date || null,
      sex: form.sex || null,
      commercial_notes: form.commercial_notes.trim() || null,
    };
    if (!requiresDoctor || !payload.doctor) {
      delete payload.doctor;
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (requiresDuplicateConfirmation) payload.confirm_duplicate = true;
      await onSubmit(payload);
    } catch (error) {
      const duplicateMessage = getDuplicateConfirmationMessage(error);
      setRequiresDuplicateConfirmation(Boolean(duplicateMessage));
      setErrorMessage(duplicateMessage || (error.response ? getErrorMessage(error) : error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="modal-layer patient-modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar paciente" />

      <section className="form-modal profile-modal patient-modal" aria-labelledby="patient-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Pacientes</span>
            <h2 id="patient-modal-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form patient-form" onSubmit={handleSubmit}>
          <div className="modal-scroll-area">
            <label>
              <span>Primer nombre</span>
              <input name="first_name" onChange={handleChange} required value={form.first_name} />
            </label>
            {requiresDoctor ? (
              <label>
                <span>Doctor responsable</span>
                <SearchSelect name="doctor" onChange={handleChange} required value={form.doctor}>
                  <option value="">Seleccione doctor</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </SearchSelect>
              </label>
            ) : null}
            <label>
              <span>Apellido</span>
              <input name="last_name" onChange={handleChange} required value={form.last_name} />
            </label>
            <label>
              <span>DNI{contactLabel}</span>
              <input
                inputMode="numeric"
                maxLength={fieldFormat.dniMask?.length || 25}
                name="dni"
                onChange={handleDniChange}
                required={!contactEither}
                placeholder={dniPlaceholder || "DNI"}
                value={form.dni}
              />
              {fieldFormat.dniMask ? <small>Formato: {fieldFormat.dniMask}</small> : null}
            </label>
            <label>
              <span>Telefono{contactLabel}</span>
              <div className="phone-input-group">
                <input aria-label="Codigo de pais" disabled value={fieldFormat.phoneCode} />
                <input
                  inputMode="numeric"
                  maxLength={fieldFormat.phoneMask.length}
                  name="phone"
                  onChange={handlePhoneChange}
                  required={!contactEither}
                  placeholder={fieldFormat.phoneMask}
                  value={form.phone}
                />
              </div>
              <small>Formato: {fieldFormat.phoneMask}</small>
            </label>
            <label>
              <span>Correo</span>
              <input name="email" onChange={handleChange} type="email" value={form.email} />
            </label>
            <label>
              <span>Fecha de nacimiento</span>
              <input name="birth_date" onChange={handleChange} type="date" value={form.birth_date} />
            </label>
            <label>
              <span>Sexo</span>
              <SearchSelect name="sex" onChange={handleChange} value={form.sex}>
                <option value="">Sin especificar</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="O">Otro</option>
              </SearchSelect>
            </label>
            <label className="field-wide">
              <span>Notas comerciales</span>
              <textarea name="commercial_notes" onChange={handleChange} rows="3" value={form.commercial_notes} />
            </label>

            {errorMessage ? <p className="form-error field-wide">{errorMessage}</p> : null}
          </div>

          <div className="modal-actions">
            <button className="secondary-action compact" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-action compact" disabled={isSaving} type="submit">
              <Save size={18} aria-hidden="true" />
              {isSaving ? "Guardando" : requiresDuplicateConfirmation ? "Confirmar registro" : "Guardar"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
