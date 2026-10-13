import {
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
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
import { AppointmentRow } from "../components/AppointmentRow";
import { AppointmentStatusDialog } from "../components/AppointmentStatusDialog";
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
    closeAppointmentStatusDialog,
    confirmAppointment,
    confirmAppointmentStatus,
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
    isUpdatingAppointmentStatus,
    message,
    metrics,
    minAppointmentTime,
    modalErrorMessage,
    pendingClosureAppointments,
    saveAppointment,
    selectAppointment,
    selectDate,
    selectedAppointment,
    appointmentAction,
    selectedAppointments,
    selectedDate,
    sendReminder,
    startNewAppointment,
    requestAppointmentStatus,
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
          <span>Por atender</span>
          <strong>{metrics.active}</strong>
          <small>Horario vigente</small>
        </div>
        <div className="metric-card">
          <span>Pendientes de cierre</span>
          <strong>{metrics.pending}</strong>
          <small>Requieren una decisión</small>
        </div>
        <div className="metric-card">
          <span>Canceladas</span>
          <strong>{metrics.cancelled}</strong>
          <small>Horario liberado</small>
        </div>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      {pendingClosureAppointments.length ? (
        <section className="list-panel pending-closure-panel" aria-label="Citas pendientes de cierre">
          <header className="pending-closure-header">
            <span className="pending-closure-icon">
              <CircleAlert size={21} aria-hidden="true" />
            </span>
            <div>
              <span className="eyebrow">Acción requerida</span>
              <h2>Pendientes de cierre</h2>
              <p>El horario ya terminó. Registra el resultado o crea una nueva cita.</p>
            </div>
            <strong>{pendingClosureAppointments.length}</strong>
          </header>
          <div className="pending-closure-list">
            {pendingClosureAppointments.map((appointment) => (
              <AppointmentRow
                appointment={appointment}
                key={appointment.id}
                locale={locale}
                onConfirm={confirmAppointment}
                onMarkAttended={(selected) => requestAppointmentStatus(selected, "attended")}
                onMarkNoShow={(selected) => requestAppointmentStatus(selected, "no_show")}
                onRemind={sendReminder}
                onRequestCancellation={(selected) => requestAppointmentStatus(selected, "cancelled")}
                onReschedule={selectAppointment}
                showDate
                statusLabels={appointmentStatusLabels}
                statusTone={appointmentStatusTone}
              />
            ))}
          </div>
        </section>
      ) : null}

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
              <AppointmentRow
                appointment={appointment}
                key={appointment.id}
                locale={locale}
                onConfirm={confirmAppointment}
                onMarkAttended={(selected) => requestAppointmentStatus(selected, "attended")}
                onMarkNoShow={(selected) => requestAppointmentStatus(selected, "no_show")}
                onRemind={sendReminder}
                onRequestCancellation={(selected) => requestAppointmentStatus(selected, "cancelled")}
                onReschedule={selectAppointment}
                statusLabels={appointmentStatusLabels}
                statusTone={appointmentStatusTone}
              />
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
          onRequestCancellation={(appointment) => requestAppointmentStatus(appointment, "cancelled")}
          onSubmit={saveAppointment}
          selectedAppointment={selectedAppointment}
          todayDate={today()}
        />
      ) : null}

      <AppointmentStatusDialog
        action={appointmentAction}
        isProcessing={isUpdatingAppointmentStatus}
        locale={locale}
        onClose={closeAppointmentStatusDialog}
        onConfirm={confirmAppointmentStatus}
      />
    </div>
  );
}
