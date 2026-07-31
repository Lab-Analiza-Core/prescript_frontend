import { Save } from "lucide-react";

import { PageHeader } from "../../../shared/components/PageHeader";

export function DoctorProfile() {
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Perfil" title="Perfil del doctor">
        Datos de contacto, preferencias y disponibilidad operativa.
      </PageHeader>

      <form className="form-grid">
        <label>
          <span>Especialidad</span>
          <input defaultValue="Cardiologia" />
        </label>
        <label>
          <span>Telefono</span>
          <input defaultValue="+504 9999-0000" />
        </label>
        <label className="field-wide">
          <span>Preferencias</span>
          <textarea defaultValue="Atencion por cita, recetas digitales habilitadas." rows="4" />
        </label>
        <button className="primary-action compact" type="button">
          <Save size={18} aria-hidden="true" />
          Guardar
        </button>
      </form>
    </div>
  );
}
