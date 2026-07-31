import { Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const emptyForm = {
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
  first_name: patient?.first_name || "",
  last_name: patient?.last_name || "",
  dni: patient?.dni || "",
  phone: patient?.phone || "",
  email: patient?.email || "",
  birth_date: patient?.birth_date || "",
  sex: patient?.sex || "",
  commercial_notes: patient?.commercial_notes || "",
});

export function PatientModal({ isOpen, mode, onClose, onSubmit, patient }) {
  const [form, setForm] = useState(() => (isOpen ? getInitialForm(patient) : emptyForm));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const title = useMemo(() => (mode === "edit" ? "Modificar paciente" : "Nuevo paciente"), [mode]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const buildPayload = () => ({
    ...form,
    dni: form.dni.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    birth_date: form.birth_date || null,
    sex: form.sex || null,
    commercial_notes: form.commercial_notes.trim() || null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSaving(true);
    try {
      await onSubmit(buildPayload());
    } catch (error) {
      const detail = error.response?.data;
      setErrorMessage(
        typeof detail === "string"
          ? detail
          : detail?.detail || "No se pudo guardar el paciente. Revise los datos.",
      );
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
            <label>
              <span>Apellido</span>
              <input name="last_name" onChange={handleChange} required value={form.last_name} />
            </label>
            <label>
              <span>DNI</span>
              <input name="dni" onChange={handleChange} value={form.dni} />
            </label>
            <label>
              <span>Telefono</span>
              <input name="phone" onChange={handleChange} value={form.phone} />
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
