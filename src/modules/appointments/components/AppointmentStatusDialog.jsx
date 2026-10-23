import { CalendarCheck, CalendarX2, UserX, X } from "lucide-react";

import { ExternalBadge } from "../../../shared/components/ExternalBadge";
import { toTime } from "../appointmentUtils";

const ACTION_CONTENT = {
  attended: {
    Icon: CalendarCheck,
    eyebrow: "Cerrar atención",
    title: "Marcar cita como atendida",
    description: "La cita saldrá de pendientes y quedará registrada como una atención realizada.",
    confirmLabel: "Sí, marcar atendida",
    processingLabel: "Guardando",
    buttonClassName: "primary-action compact",
    toneClassName: "is-success",
  },
  cancelled: {
    Icon: CalendarX2,
    eyebrow: "Confirmación",
    title: "Cancelar cita",
    description: "La cita quedará registrada como cancelada y el horario volverá a estar disponible.",
    confirmLabel: "Sí, cancelar cita",
    processingLabel: "Cancelando",
    buttonClassName: "danger-action compact",
    toneClassName: "is-danger",
  },
  no_show: {
    Icon: UserX,
    eyebrow: "Cerrar atención",
    title: "Registrar inasistencia",
    description: "La cita quedará cerrada como no presentada y se conservará en el historial del paciente.",
    confirmLabel: "Sí, no se presentó",
    processingLabel: "Guardando",
    buttonClassName: "danger-action compact",
    toneClassName: "is-danger",
  },
};

export function AppointmentStatusDialog({ action, isProcessing, locale, onClose, onConfirm }) {
  if (!action?.appointment || !ACTION_CONTENT[action.status]) return null;

  const { appointment, status } = action;
  const content = ACTION_CONTENT[status];
  const { Icon } = content;
  const appointmentDate = new Date(appointment.scheduled_at);
  const formattedDate = appointmentDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" disabled={isProcessing} onClick={onClose} type="button" aria-label="Volver sin cambiar la cita" />
      <section className="form-modal appointment-status-modal" aria-labelledby="appointment-status-title" role="alertdialog" aria-modal="true">
        <header className="modal-header">
          <div className={`doctor-avatar appointment-status-avatar ${content.toneClassName}`}>
            <Icon size={22} aria-hidden="true" />
          </div>
          <div>
            <span className={`eyebrow appointment-status-eyebrow ${content.toneClassName}`}>{content.eyebrow}</span>
            <h2 id="appointment-status-title">{content.title}</h2>
          </div>
          <button className="icon-button" disabled={isProcessing} onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className="appointment-status-body">
          <p>{content.description}</p>
          <div className={`appointment-status-summary ${content.toneClassName}`}>
            <strong>{appointment.patient_name}</strong>
            <span>{formattedDate} · {toTime(appointment.scheduled_at, locale)}</span>
            <small>{appointment.doctor_name}</small>
            {appointment.doctor_is_external ? <ExternalBadge /> : null}
          </div>
        </div>
        <div className="confirm-actions">
          <button className="secondary-action compact" disabled={isProcessing} onClick={onClose} type="button">
            Volver
          </button>
          <button className={content.buttonClassName} disabled={isProcessing} onClick={onConfirm} type="button">
            <Icon size={18} aria-hidden="true" />
            {isProcessing ? content.processingLabel : content.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
