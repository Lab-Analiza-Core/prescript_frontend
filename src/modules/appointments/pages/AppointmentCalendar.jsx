import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { PageHeader } from "../../../shared/components/PageHeader";
import { useAuth } from "../../../shared/context/useAuth";
import {
  getMonthLabel,
  parseDateKey,
  today,
  WEEKDAYS,
} from "../../../shared/utils/calendarUtils";
import { AppointmentModal } from "../components/AppointmentModal";
import { toTime } from "../appointmentUtils";
import { useAgenda } from "../hooks/useAgenda";
import { getCountryLocale } from "../../../shared/utils/countryUtils";

export function AppointmentCalendar() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const agenda = useAgenda(user, searchParams.get("date"));
  const locale = getCountryLocale(user?.country);
  const {
    appointmentsByDate,
    calendarDays,
    closeAppointmentModal,
    confirmAppointment,
    doctors,
    eligiblePatients,
    errorMessage,
    form,
    goToMonth,
    handleChange,
    isAppointmentModalOpen,
    isFormConflicting,
    isFormInPast,
    isLoading,
    isSaving,
    isSecretary,
    message,
    metrics,
    minAppointmentTime,
    modalErrorMessage,
    saveAppointment,
    selectAppointment,
    selectDate,
    selectedAppointment,
    selectedAppointments,
    selectedDate,
    sendReminder,
    startNewAppointment,
    statusLabels: appointmentStatusLabels,
    statusTone: appointmentStatusTone,
    visibleMonth,
  } = agenda;

  return (
    <div className="page-stack appointment-page">
      <PageHeader
        actions={
          <button className="primary-action compact" onClick={startNewAppointment} type="button">
            <CalendarPlus size={18} aria-hidden="true" />
            Nueva cita
          </button>
        }
        eyebrow="Agenda"
        title="Agenda medica"
      >
        Programacion, confirmacion y reagendamiento posterior a preclinica.
      </PageHeader>

      <div className="metric-grid appointment-metrics">
        <div className="metric-card">
          <span>Citas del dia</span>
          <strong>{metrics.total}</strong>
          <small>{parseDateKey(selectedDate).toLocaleDateString(locale)}</small>
        </div>
        <div className="metric-card">
          <span>Confirmadas</span>
          <strong>{metrics.confirmed}</strong>
          <small>Estado activo</small>
        </div>
        <div className="metric-card">
          <span>Reprogramadas</span>
          <strong>{metrics.rescheduled}</strong>
          <small>Cambios del dia</small>
        </div>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="appointment-workspace">
        <section className="list-panel appointment-calendar-panel" aria-label="Calendario de citas">
          <header className="appointment-calendar-header">
            <div>
              <span className="eyebrow">Calendario</span>
              <h2>{getMonthLabel(visibleMonth, locale)}</h2>
            </div>
            <div className="calendar-controls">
              <button className="icon-button" onClick={() => goToMonth(-1)} type="button" aria-label="Mes anterior">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button className="secondary-action compact" onClick={() => selectDate(today())} type="button">
                Hoy
              </button>
              <button className="icon-button" onClick={() => goToMonth(1)} type="button" aria-label="Mes siguiente">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="appointment-calendar-grid" role="grid" aria-label="Mes de agenda">
            {WEEKDAYS.map((weekday) => (
              <span className="calendar-weekday" key={weekday}>
                {weekday}
              </span>
            ))}
            {calendarDays.map((day) => {
              if (day.isEmpty) return <span className="calendar-day empty" key={day.key} />;
              const dayAppointments = appointmentsByDate.get(day.dateKey) || [];
              const isSelected = day.dateKey === selectedDate;
              const isToday = day.dateKey === today();

              return (
                <button
                  className={`calendar-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                  key={day.key}
                  onClick={() => selectDate(day.dateKey)}
                  type="button"
                >
                  <span>{day.day}</span>
                  {dayAppointments.length ? (
                    <strong>
                      <CalendarClock size={14} aria-hidden="true" />
                      {dayAppointments.length}
                    </strong>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="list-panel appointment-history" aria-label="Historial de citas programadas">
          <header className="appointment-history-header">
            <div>
              <span className="eyebrow">Historial</span>
              <h2>Citas programadas</h2>
            </div>
            <span>{parseDateKey(selectedDate).toLocaleDateString(locale)}</span>
          </header>

          {isLoading ? <div className="empty-state">Cargando agenda</div> : null}
          {!isLoading && selectedAppointments.length === 0 ? <div className="empty-state">Sin citas para esta fecha</div> : null}
          {!isLoading &&
            selectedAppointments.map((appointment) => (
              <article className="appointment-row" key={appointment.id}>
                <button className="time-pill" onClick={() => selectAppointment(appointment)} type="button">
                  <Clock size={16} aria-hidden="true" />
                  {toTime(appointment.scheduled_at, locale)}
                </button>
                <div>
                  <strong>{appointment.patient_name}</strong>
                  <span>{appointment.reason || appointment.doctor_name}</span>
                </div>
                <div className="appointment-actions">
                  <span className={`status-badge ${appointmentStatusTone[appointment.status] || ""}`}>
                    {appointmentStatusLabels[appointment.status] || appointment.status}
                  </span>
                  <button aria-label="Confirmar cita" className="icon-button" onClick={() => confirmAppointment(appointment)} title="Confirmar cita" type="button">
                    <CalendarCheck size={17} aria-hidden="true" />
                  </button>
                  <button aria-label="Recordatorio WhatsApp" className="icon-button" onClick={() => sendReminder(appointment)} title="Recordatorio WhatsApp" type="button">
                    <MessageCircle size={17} aria-hidden="true" />
                  </button>
                  <button aria-label="Reagendar cita" className="icon-button" onClick={() => selectAppointment(appointment)} title="Reagendar cita" type="button">
                    <RotateCcw size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
        </section>
      </div>

      {isAppointmentModalOpen ? (
        <AppointmentModal
          doctors={doctors}
          eligiblePatients={eligiblePatients}
          form={form}
          isFormConflicting={isFormConflicting}
          isFormInPast={isFormInPast}
          isSaving={isSaving}
          isSecretary={isSecretary}
          minAppointmentTime={minAppointmentTime}
          modalErrorMessage={modalErrorMessage}
          onChange={handleChange}
          onClose={closeAppointmentModal}
          onSubmit={saveAppointment}
          selectedAppointment={selectedAppointment}
          todayDate={today()}
        />
      ) : null}
    </div>
  );
}
