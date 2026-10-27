import { Pill, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { SearchSelect } from "../../../shared/components/SearchSelect";
import { MEDICINE_CATEGORIES } from "../medicineConstants";

const emptyForm = {
  name: "",
  presentation: "",
  active_ingredient: "",
  commercial_house: "",
  category: "undetermined",
  default_dosage: "",
  default_frequency: "",
  default_duration: "",
  default_instructions: "",
  notes: "",
};

const getInitialForm = (medicine) =>
  medicine
    ? Object.fromEntries(Object.keys(emptyForm).map((field) => [field, medicine[field] ?? ""]))
    : { ...emptyForm };

export function MedicineModal({ errors = {}, isSaving, medicine, onClose, onSubmit }) {
  const [form, setForm] = useState(() => getInitialForm(medicine));
  const isEditing = Boolean(medicine);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, name: form.name.trim() });
  };

  // En un portal: la animacion de la ruta deja un transform que confina los elementos fixed.
  return createPortal(
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar medicamento" />
      <section className="form-modal profile-modal user-modal" aria-labelledby="medicine-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header user-modal-header">
          <div className="doctor-avatar">
            <Pill size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Medicamentos</span>
            <h2 id="medicine-modal-title">{isEditing ? "Editar medicamento" : "Nuevo medicamento"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form user-form" id="medicine-form" onSubmit={handleSubmit}>
          <label className="field-wide">
            <span>Nombre *</span>
            <input autoFocus maxLength={255} required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            {errors.name ? <small className="form-error" role="alert">{errors.name}</small> : null}
          </label>
          <label>
            <span>Presentacion</span>
            <input maxLength={255} placeholder="Tableta 500 mg" value={form.presentation} onChange={(event) => updateField("presentation", event.target.value)} />
          </label>
          <label>
            <span>Principio activo</span>
            <input maxLength={255} value={form.active_ingredient} onChange={(event) => updateField("active_ingredient", event.target.value)} />
          </label>
          <label>
            <span>Casa comercial</span>
            <input maxLength={255} value={form.commercial_house} onChange={(event) => updateField("commercial_house", event.target.value)} />
          </label>
          <label>
            <span>Categoria</span>
            <SearchSelect value={form.category} onChange={(event) => updateField("category", event.target.value)}>
              {MEDICINE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </SearchSelect>
          </label>

          <label>
            <span>Dosis habitual</span>
            <input maxLength={120} placeholder="1 tableta" value={form.default_dosage} onChange={(event) => updateField("default_dosage", event.target.value)} />
          </label>
          <label>
            <span>Frecuencia habitual</span>
            <input maxLength={120} placeholder="Cada 8 horas" value={form.default_frequency} onChange={(event) => updateField("default_frequency", event.target.value)} />
          </label>
          <label>
            <span>Duracion habitual</span>
            <input maxLength={120} placeholder="5 dias" value={form.default_duration} onChange={(event) => updateField("default_duration", event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Indicaciones habituales</span>
            <textarea rows={3} value={form.default_instructions} onChange={(event) => updateField("default_instructions", event.target.value)} />
          </label>
          <label className="field-wide">
            <span>Notas privadas</span>
            <textarea rows={2} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
          </label>
        </form>

        <div className="modal-actions">
          <button className="secondary-action compact" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-action compact" disabled={isSaving} form="medicine-form" type="submit">
            {isSaving ? "Guardando" : "Guardar"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
