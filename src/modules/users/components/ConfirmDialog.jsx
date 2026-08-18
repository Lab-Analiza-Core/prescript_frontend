import { KeyRound, Trash2, X } from "lucide-react";

export function ConfirmDialog({ isProcessing, message, onClose, onConfirm, title, variant = "danger" }) {
  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cancelar" />
      <section className="profile-modal confirm-modal" aria-labelledby="user-confirm-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className={variant === "danger" ? "doctor-avatar danger-avatar" : "doctor-avatar"}>
            {variant === "danger" ? <Trash2 size={22} aria-hidden="true" /> : <KeyRound size={22} aria-hidden="true" />}
          </div>
          <div>
            <span className={variant === "danger" ? "eyebrow danger-text" : "eyebrow"}>Confirmacion</span>
            <h2 id="user-confirm-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="secondary-action compact" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className={variant === "danger" ? "danger-action compact" : "primary-action compact"} disabled={isProcessing} onClick={onConfirm} type="button">
            {isProcessing ? "Procesando" : "Confirmar"}
          </button>
        </div>
      </section>
    </div>
  );
}
