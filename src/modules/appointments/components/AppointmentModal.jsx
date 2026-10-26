import {
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  CircleAlert,
  Clock3,
  Save,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import { isAppointmentPastDue } from "../appointmentUtils";
import { SearchSelect } from "../../../shared/components/SearchSelect";

export function AppointmentModal({
  eligiblePatients,
  form,
  isFormConflicting,
  isFormInPast,
  isSaving,
  isSecretary,
  minAppointmentTime,
  modalErrorMessage,
  onChange,
  onClose,
  onRequestCancellation,
  onSubmit,
  selectedAppointment,
  todayDate,
  doctors,
}) {
  const isRescheduling = Boolean(selectedAppointment);
  const isPastDueReschedule = isAppointmentPastDue(selectedAppointment);
  const selectedPatient = eligiblePatients.find((patient) => String(patient.id) === String(form.patient));
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === String(form.doctor));
  const scheduleError = isFormInPast
    ? "La fecha y hora deben ser posteriores al momento actual."
    : modalErrorMessage;

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar programacion de cita" />
      <section className="form-modal appointment-modal" aria-labelledby="appointment-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar">
            <CalendarPlus size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Agenda</span>
            <h2 id="appointment-modal-title">{isPastDueReschedule ? "Reprogramar cita vencida" : isRescheduling ? "Reprogramar cita" : "Programar cita"}</h2>
            <p>
              {isPastDueReschedule
                ? "La cita anterior conservará su fecha y quedará cerrada en el historial."
                : isRescheduling
                  ? "Ajusta el horario sin perder los datos de la cita."
                  : "Organiza la atención en un horario disponible."}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form appointment-modal-form" onSubmit={onSubmit}>
          <div className={`appointment-form-intro field-wide${isRescheduling ? " is-rescheduling" : ""}`}>
            <span className="appointment-form-intro-icon">
              {isRescheduling ? <CalendarClock size={20} aria-hidden="true" /> : <CalendarPlus size={20} aria-hidden="true" />}
            </span>
            <div>
              <strong>{isPastDueReschedule ? "Nueva fecha para la atención" : isRescheduling ? selectedAppointment.patient_name : "Nueva cita médica"}</strong>
              <span>
                {isPastDueReschedule
                  ? `${selectedAppointment.patient_name} · Se creará una nueva cita vinculada al mismo paciente.`
                  : isRescheduling
                  ? `${selectedDoctor?.full_name || selectedAppointment.doctor_name} · Cambia fecha, hora o duración.`
                  : "Selecciona el profesional, el paciente y luego define el horario."}
              </span>
            </div>
          </div>

          <fieldset className="appointment-form-section field-wide">
            <legend>
              <Stethoscope size={17} aria-hidden="true" />
              Datos de atención
            </legend>
            <div className="appointment-section-grid">
              <label>
                <span>Doctor</span>
                <SearchSelect disabled={!isSecretary || isRescheduling} name="doctor" onChange={onChange} required value={form.doctor}>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </SearchSelect>
                <small>{isRescheduling ? "Se conserva el profesional de la cita." : "Profesional que atenderá al paciente."}</small>
              </label>

              <label>
                <span>Paciente con preclínica</span>
                <SearchSelect disabled={isRescheduling} name="patient" onChange={onChange} required value={form.patient}>
                  <option value="">Seleccione paciente</option>
                  {eligiblePatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </SearchSelect>
                <small>{selectedPatient ? `DNI ${selectedPatient.dni || "sin registrar"}` : "Solo se muestran pacientes con preclínica."}</small>
              </label>
            </div>
          </fieldset>

          <fieldset className="appointment-form-section field-wide">
            <legend>
              <Clock3 size={17} aria-hidden="true" />
              Horario de la cita
            </legend>
            <div className="appointment-section-grid appointment-schedule-grid">
              <label>
                <span>Fecha</span>
                <input min={todayDate} name="date" onChange={onChange} required type="date" value={form.date} />
              </label>
              <label>
                <span>Hora de inicio</span>
                <input min={minAppointmentTime} name="time" onChange={onChange} required type="time" value={form.time} />
              </label>
              <label>
                <span>Duración</span>
                <span className="input-shell appointment-duration-input">
                  <input min="10" name="duration_minutes" onChange={onChange} required step="5" type="number" value={form.duration_minutes} />
                  <span>min</span>
                </span>
              </label>
            </div>
            <p className={`appointment-schedule-feedback${scheduleError ? " is-error" : ""}`}>
              {scheduleError ? <CircleAlert size={16} aria-hidden="true" /> : <CalendarClock size={16} aria-hidden="true" />}
              {scheduleError || "El sistema comprobará que el horario esté disponible para el doctor."}
            </p>
          </fieldset>

          <fieldset className="appointment-form-section field-wide">
            <legend>
              <UserRound size={17} aria-hidden="true" />
              Motivo de consulta
            </legend>
            <label>
              <span>Motivo</span>
              <textarea maxLength="255" name="reason" onChange={onChange} placeholder="Ej. Control mensual, seguimiento o consulta general" rows="3" value={form.reason} />
              <small>Una descripción breve ayuda al equipo a preparar la atención.</small>
            </label>
          </fieldset>

          <div className="modal-actions appointment-modal-actions">
            {isRescheduling && !isPastDueReschedule ? (
              <button className="danger-action compact appointment-cancel-action" onClick={() => onRequestCancellation(selectedAppointment)} type="button">
                <CalendarX2 size={18} aria-hidden="true" />
                Cancelar cita
              </button>
            ) : null}
            <button className="secondary-action compact" onClick={onClose} type="button">
              Cerrar
            </button>
            <button className="primary-action compact" disabled={isSaving || !form.patient || !form.doctor || isFormInPast || isFormConflicting} type="submit">
              <Save size={18} aria-hidden="true" />
              {isSaving ? "Guardando" : isPastDueReschedule ? "Crear nueva cita" : isRescheduling ? "Confirmar reprogramación" : "Programar cita"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
