import { AlertTriangle, X } from "lucide-react";

export function DeactivatePatientDialog({ isOpen, isProcessing, onClose, onConfirm, patient }) {
  if (!isOpen) return null;

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cancelar desactivacion" />

      <section className="profile-modal confirm-modal" aria-labelledby="deactivate-patient-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar danger-avatar">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow danger-text">Confirmacion</span>
            <h2 id="deactivate-patient-title">Desactivar paciente</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="confirm-body">
          <p>
            ¿Debe desactivarse el paciente <strong>{patient?.full_name || "seleccionado"}</strong>?
          </p>
        </div>

        <div className="confirm-actions">
          <button className="secondary-action compact" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="danger-action compact" disabled={isProcessing} onClick={onConfirm} type="button">
            {isProcessing ? "Desactivando" : "Desactivar"}
          </button>
        </div>
      </section>
    </div>
  );
}
