import { CalendarPlus, Clock, UserPlus } from "lucide-react";

import { PageHeader } from "../../../shared/components/PageHeader";

const appointments = [
  { time: "08:30", patient: "Mario Castillo", reason: "Control cardiologico", status: "Confirmada" },
  { time: "10:00", patient: "Andrea Molina", reason: "Seguimiento", status: "Preclinica" },
  { time: "11:45", patient: "Luis Mejia", reason: "Primera consulta", status: "Pendiente" },
];

export function AppointmentCalendar() {
  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <button className="primary-action compact" type="button">
            <CalendarPlus size={18} aria-hidden="true" />
            Nueva cita
          </button>
        }
        eyebrow="Agenda"
        title="Agenda medica"
      >
        Turnos del dia, tiempos de sala y estado de atencion.
      </PageHeader>

      <div className="metric-grid">
        <div className="metric-card">
          <span>Citas hoy</span>
          <strong>18</strong>
        </div>
        <div className="metric-card">
          <span>Confirmadas</span>
          <strong>14</strong>
        </div>
        <div className="metric-card">
          <span>En preclinica</span>
          <strong>3</strong>
        </div>
      </div>

      <div className="list-panel">
        {appointments.map((appointment) => (
          <article className="appointment-row" key={`${appointment.time}-${appointment.patient}`}>
            <div className="time-pill">
              <Clock size={16} aria-hidden="true" />
              {appointment.time}
            </div>
            <div>
              <strong>{appointment.patient}</strong>
              <span>{appointment.reason}</span>
            </div>
            <span className="status-badge">{appointment.status}</span>
          </article>
        ))}
      </div>

      <button className="secondary-action" type="button">
        <UserPlus size={18} aria-hidden="true" />
        Registrar paciente desde cita
      </button>
    </div>
  );
}
