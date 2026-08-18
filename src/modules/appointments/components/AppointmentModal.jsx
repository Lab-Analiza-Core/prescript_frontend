import { CalendarPlus, Save, X } from "lucide-react";

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
  onSubmit,
  selectedAppointment,
  todayDate,
  doctors,
}) {
  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar programacion de cita" />
      <section className="appointment-modal" aria-labelledby="appointment-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar">
            <CalendarPlus size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Agenda</span>
            <h2 id="appointment-modal-title">{selectedAppointment ? "Reagendar cita" : "Programar cita"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form appointment-modal-form" onSubmit={onSubmit}>
          <label className="field-wide">
            <span>Doctor</span>
            <select disabled={!isSecretary} name="doctor" onChange={onChange} required value={form.doctor}>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-wide">
            <span>Paciente con preclinica</span>
            <select name="patient" onChange={onChange} required value={form.patient}>
              <option value="">Seleccione paciente</option>
              {eligiblePatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Fecha</span>
            <input min={todayDate} name="date" onChange={onChange} required type="date" value={form.date} />
          </label>
          <label>
            <span>Hora</span>
            <input min={minAppointmentTime} name="time" onChange={onChange} required type="time" value={form.time} />
          </label>

          <label>
            <span>Duracion</span>
            <input min="10" name="duration_minutes" onChange={onChange} step="5" type="number" value={form.duration_minutes} />
          </label>
          <label>
            <span>Motivo</span>
            <input maxLength="255" name="reason" onChange={onChange} placeholder="Control, seguimiento, consulta" value={form.reason} />
          </label>

          {modalErrorMessage ? <p className="form-error field-wide">{modalErrorMessage}</p> : null}

          <div className="modal-actions">
            <button className="secondary-action compact" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-action compact" disabled={isSaving || !form.patient || !form.doctor || isFormInPast || isFormConflicting} type="submit">
              <Save size={18} aria-hidden="true" />
              {isSaving ? "Guardando" : selectedAppointment ? "Guardar reagenda" : "Programar cita"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
