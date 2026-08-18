import { FileText, Save, Stethoscope, X } from "lucide-react";
import { Link } from "react-router-dom";

export function PreclinicVitalsModal({
  comparison,
  form,
  isFutureDate,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  selectedRecord,
  selectedSource,
}) {
  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar captura de signos" />
      <section className="preclinic-modal" aria-labelledby="preclinic-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar">
            <Stethoscope size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Preclinica</span>
            <h2 id="preclinic-modal-title">{selectedRecord?.patient_name || "Signos vitales"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="preclinic-modal-summary">
          <div className="preclinic-patient">
            <Stethoscope size={20} aria-hidden="true" />
            <div>
              <strong>{selectedRecord?.patient_name || "Seleccione un paciente registrado"}</strong>
              {selectedRecord ? (
                <span>{`Paciente registrado #${selectedRecord.patient}${selectedRecord.patient_dni ? ` - DNI ${selectedRecord.patient_dni}` : ""}`}</span>
              ) : null}
            </div>
            {selectedRecord ? (
              <Link className="secondary-action compact preclinic-patient-link" to={`/app/pacientes/${selectedRecord.patient}`}>
                <FileText size={17} aria-hidden="true" />
                Expediente
              </Link>
            ) : null}
          </div>

          {selectedRecord ? (
            <div className="preclinic-context">
              <span>{selectedSource.type === "appointment" ? selectedRecord.reason || "Sin motivo registrado" : "Captura sin cita"}</span>
              <span>{selectedRecord.doctor_name}</span>
              <span>{selectedRecord.is_pediatric ? "Altura habilitada por pediatria" : "Altura no aplica para esta especialidad"}</span>
            </div>
          ) : null}
        </div>

        <form className="form-grid preclinic-form preclinic-modal-form" onSubmit={onSubmit}>
          <div className="auth-grid">
            <label>
              <span>Presion sistolica</span>
              <input name="blood_pressure_systolic" onChange={onChange} type="number" value={form.blood_pressure_systolic} />
              <small>Previo: {comparison?.blood_pressure_systolic || "sin dato"}</small>
            </label>

            <label>
              <span>Presion diastolica</span>
              <input name="blood_pressure_diastolic" onChange={onChange} type="number" value={form.blood_pressure_diastolic} />
              <small>Previo: {comparison?.blood_pressure_diastolic || "sin dato"}</small>
            </label>
          </div>

          <div className="auth-grid">
            <label>
              <span>Oxigenacion</span>
              <input max="100" min="0" name="oxygen_saturation" onChange={onChange} step="0.1" type="number" value={form.oxygen_saturation} />
              <small>Solo captura actual</small>
            </label>

            <label>
              <span>Temperatura</span>
              <input name="temperature" onChange={onChange} step="0.1" type="number" value={form.temperature} />
              <small>Solo captura actual</small>
            </label>
          </div>

          <div className="auth-grid">
            <label>
              <span>Altura</span>
              <input disabled={!selectedRecord?.is_pediatric} name="height_cm" onChange={onChange} step="0.1" type="number" value={form.height_cm} />
              <small>{selectedRecord?.is_pediatric ? `Previo: ${comparison?.height_cm || "sin dato"}` : "Solo pediatria"}</small>
            </label>

            <label>
              <span>Peso</span>
              <input name="weight_kg" onChange={onChange} step="0.1" type="number" value={form.weight_kg} />
              <small>Previo: {comparison?.weight_kg || "sin dato"}</small>
            </label>
          </div>

          <div className="modal-actions">
            <button className="secondary-action compact" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-action compact" disabled={!selectedRecord || isSaving || isFutureDate} type="submit">
              <Save size={18} aria-hidden="true" />
              {isSaving ? "Guardando" : "Guardar signos"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
