import { Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  applyNumericMask,
  getCountryFieldFormat,
  isMaskComplete,
  maskPlaceholder,
  stripPhoneCountryCode,
} from "../../../shared/utils/fieldMasks";

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

export function PatientModal({ country = "HN", doctorOptions = [], isOpen, mode, onClose, onSubmit, patient, requiresDoctor = false }) {
  const [form, setForm] = useState(() => (isOpen ? getInitialForm(patient) : emptyForm));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const title = useMemo(() => (mode === "edit" ? "Modificar paciente" : "Nuevo paciente"), [mode]);
  const fieldFormat = useMemo(() => getCountryFieldFormat(country), [country]);
  const dniPlaceholder = useMemo(() => maskPlaceholder(fieldFormat.dniMask), [fieldFormat.dniMask]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDniChange = (event) => {
    setForm((current) => ({
      ...current,
      dni: applyNumericMask(event.target.value, fieldFormat.dniMask),
    }));
  };

  const handlePhoneChange = (event) => {
    setForm((current) => ({
      ...current,
      phone: applyNumericMask(
        stripPhoneCountryCode(event.target.value, fieldFormat.phoneCode),
        fieldFormat.phoneMask,
      ),
    }));
  };

  const buildPayload = () => {
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
      await onSubmit(buildPayload());
    } catch (error) {
      setErrorMessage(error.response ? getErrorMessage(error) : error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="modal-layer patient-modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar paciente" />

      <section className="profile-modal patient-modal" aria-labelledby="patient-modal-title" role="dialog" aria-modal="true">
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
                <select name="doctor" onChange={handleChange} required value={form.doctor}>
                  <option value="">Seleccione doctor</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              <span>Apellido</span>
              <input name="last_name" onChange={handleChange} required value={form.last_name} />
            </label>
            <label>
              <span>DNI</span>
              <input
                inputMode="numeric"
                maxLength={fieldFormat.dniMask?.length || 25}
                name="dni"
                onChange={handleDniChange}
                placeholder={dniPlaceholder || "DNI"}
                value={form.dni}
              />
              {fieldFormat.dniMask ? <small>Formato: {fieldFormat.dniMask}</small> : null}
            </label>
            <label>
              <span>Telefono</span>
              <div className="phone-input-group">
                <input aria-label="Codigo de pais" disabled value={fieldFormat.phoneCode} />
                <input
                  inputMode="numeric"
                  maxLength={fieldFormat.phoneMask.length}
                  name="phone"
                  onChange={handlePhoneChange}
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
              <select name="sex" onChange={handleChange} value={form.sex}>
                <option value="">Sin especificar</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="O">Otro</option>
              </select>
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
              {isSaving ? "Guardando" : "Guardar"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
