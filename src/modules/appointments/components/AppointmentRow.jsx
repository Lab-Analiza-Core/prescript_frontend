import {
  CalendarCheck,
  CalendarX2,
  Clock,
  MessageCircle,
  RotateCcw,
  UserX,
} from "lucide-react";

import {
  ACTIVE_APPOINTMENT_STATUSES,
  isAppointmentPastDue,
  toTime,
} from "../appointmentUtils";

export function AppointmentRow({
  appointment,
  locale,
  onConfirm,
  onMarkAttended,
  onMarkNoShow,
  onRemind,
  onRequestCancellation,
  onReschedule,
  showDate = false,
  statusLabels,
  statusTone,
}) {
  const isPendingClosure = isAppointmentPastDue(appointment);
  const isActive = ACTIVE_APPOINTMENT_STATUSES.has(appointment.status);
  const canManageUpcoming = isActive && !isPendingClosure;
  const appointmentDate = new Date(appointment.scheduled_at);
  const rowClassName = [
    "appointment-row",
    ["attended", "cancelled", "no_show", "superseded"].includes(appointment.status) ? "is-closed" : "",
    isPendingClosure ? "is-pending-closure" : "",
  ].filter(Boolean).join(" ");

  return (
    <article className={rowClassName}>
      <span className="time-pill">
        <Clock size={16} aria-hidden="true" />
        <span>
          {showDate ? <small>{appointmentDate.toLocaleDateString(locale, { day: "2-digit", month: "short" })}</small> : null}
          <strong>{toTime(appointment.scheduled_at, locale)}</strong>
        </span>
      </span>
      <div className="appointment-row-copy">
        <strong>{appointment.patient_name}</strong>
        <span>{appointment.reason || appointment.doctor_name}</span>
        {showDate && appointment.reason ? <small>{appointment.doctor_name}</small> : null}
      </div>
      <div className="appointment-actions">
        <span className={`status-badge ${isPendingClosure ? "pending" : statusTone[appointment.status] || ""}`}>
          {isPendingClosure ? "Pendiente de cierre" : statusLabels[appointment.status] || appointment.status}
        </span>

        {isPendingClosure ? (
          <div className="appointment-action-controls">
            <button className="appointment-action-button is-success" onClick={() => onMarkAttended(appointment)} type="button">
              <CalendarCheck size={15} aria-hidden="true" />
              Atendida
            </button>
            <button className="appointment-action-button is-danger" onClick={() => onMarkNoShow(appointment)} type="button">
              <UserX size={15} aria-hidden="true" />
              No se presentó
            </button>
            <button className="appointment-action-button is-reschedule" onClick={() => onReschedule(appointment)} type="button">
              <RotateCcw size={15} aria-hidden="true" />
              Reprogramar
            </button>
          </div>
        ) : null}

        {canManageUpcoming ? (
          <div className="appointment-action-controls">
            {appointment.status === "rescheduled" ? (
              <button className="appointment-action-button" onClick={() => onConfirm(appointment)} type="button">
                <CalendarCheck size={15} aria-hidden="true" />
                Confirmar
              </button>
            ) : null}
            <button className="appointment-action-button" onClick={() => onRemind(appointment)} type="button">
              <MessageCircle size={15} aria-hidden="true" />
              Recordar
            </button>
            <button className="appointment-action-button is-reschedule" onClick={() => onReschedule(appointment)} type="button">
              <RotateCcw size={15} aria-hidden="true" />
              Reprogramar
            </button>
            <button className="appointment-action-button is-danger" onClick={() => onRequestCancellation(appointment)} type="button">
              <CalendarX2 size={15} aria-hidden="true" />
              Cancelar
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
