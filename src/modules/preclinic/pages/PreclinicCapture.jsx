import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

import { PagedList } from "../../../shared/components/PagedList";
import { PageHeader } from "../../../shared/components/PageHeader";
import {
  getMonthLabel,
  moveMonth,
  parseDateKey,
  WEEKDAYS,
} from "../../../shared/utils/calendarUtils";
import { PreclinicVitalsModal } from "../components/PreclinicVitalsModal";
import { usePreclinicCapture } from "../hooks/usePreclinicCapture";
import { formatTime } from "../preclinicUtils";
import { useAuth } from "../../../shared/context/useAuth";
import { getCountryLocale } from "../../../shared/utils/countryUtils";

export function PreclinicCapture() {
  const { user } = useAuth();
  const locale = getCountryLocale(user?.country);
  const preclinic = usePreclinicCapture();
  const {
    appointments,
    calendarDays,
    closeVitalsModal,
    completedCount,
    comparison,
    errorMessage,
    form,
    goToMonth,
    handleChange,
    isFutureDate,
    isLoading,
    isSaving,
    isVitalsModalOpen,
    message,
    patientSearch,
    patients,
    saveVitals,
    selectDate,
    selectRecord,
    selectedDate,
    selectedRecord,
    selectedSource,
    setPatientSearch,
    todayDate,
    totalRecords,
    visibleMonth,
  } = preclinic;

  return (
    <div className="page-stack preclinic-page">
      <PageHeader eyebrow="Preclinica" title="Signos vitales">
        Captura clinica asociada al expediente del paciente registrado.
      </PageHeader>

      <div className="metric-grid preclinic-metrics">
        <div className="metric-card">
          <span>Citas de la fecha</span>
          <strong>{appointments.length}</strong>
          <small>{parseDateKey(selectedDate).toLocaleDateString(locale)}</small>
        </div>
        <div className="metric-card">
          <span>Pacientes registrados</span>
          <strong>{patients.length}</strong>
          <small>Disponibles para captura</small>
        </div>
        <div className="metric-card">
          <span>Capturas guardadas</span>
          <strong>{completedCount}</strong>
          <small>{totalRecords ? `${completedCount} de ${totalRecords}` : "Sin registros"}</small>
        </div>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="preclinic-workspace">
        <section className="list-panel preclinic-calendar-panel" aria-label="Calendario de preclinica">
          <header className="appointment-calendar-header">
            <div>
              <span className="eyebrow">Calendario</span>
              <h2>{getMonthLabel(visibleMonth, locale)}</h2>
            </div>
            <div className="calendar-controls">
              <button className="icon-button" onClick={() => goToMonth(-1)} type="button" aria-label="Mes anterior">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button className="secondary-action compact" onClick={() => selectDate(todayDate)} type="button">
                Hoy
              </button>
              <button className="icon-button" disabled={moveMonth(visibleMonth, 1) > todayDate} onClick={() => goToMonth(1)} type="button" aria-label="Mes siguiente">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="appointment-calendar-grid" role="grid" aria-label="Mes de preclinica">
            {WEEKDAYS.map((weekday) => (
              <span className="calendar-weekday" key={weekday}>
                {weekday}
              </span>
            ))}
            {calendarDays.map((day) => {
              if (day.isEmpty) return <span className="calendar-day empty" key={day.key} />;
              const isSelected = day.dateKey === selectedDate;
              const isToday = day.dateKey === todayDate;
              const isFuture = day.dateKey > todayDate;

              return (
                <button
                  className={`calendar-day${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                  disabled={isFuture}
                  key={day.key}
                  onClick={() => selectDate(day.dateKey)}
                  type="button"
                >
                  <span>{day.day}</span>
                  {isSelected ? (
                    <strong>
                      <CalendarClock size={14} aria-hidden="true" />
                      {totalRecords}
                    </strong>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="list-panel preclinic-records" aria-label="Pacientes para preclinica">
          <header className="appointment-history-header">
            <div>
              <span className="eyebrow">Jornada</span>
              <h2>Pacientes del dia</h2>
            </div>
            <span>{parseDateKey(selectedDate).toLocaleDateString(locale)}</span>
          </header>

          <div className="preclinic-search">
            <input
              aria-label="Buscar paciente registrado"
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Buscar por nombre, DNI o telefono"
              type="search"
              value={patientSearch}
            />
          </div>

          {isLoading ? <div className="empty-state">Cargando registros</div> : null}
          {!isLoading && totalRecords === 0 ? <div className="empty-state">Sin registros para esta fecha</div> : null}

          {!isLoading && appointments.length ? <div className="preclinic-section-title">Citas de la fecha</div> : null}
          {!isLoading ? (
            <PagedList
              items={appointments}
              renderItem={(appointment) => (
                <button
                  className={selectedSource.type === "appointment" && String(appointment.id) === selectedSource.id ? "preclinic-appointment active" : "preclinic-appointment"}
                  key={`appointment-${appointment.id}`}
                  onClick={() => selectRecord("appointment", appointment)}
                  type="button"
                >
                  <span>{formatTime(appointment.scheduled_at, locale)}</span>
                  <strong>{appointment.patient_name}</strong>
                  <small>{appointment.patient_dni ? `DNI ${appointment.patient_dni}` : `Paciente #${appointment.patient}`}</small>
                </button>
              )}
              resetKey={selectedDate}
            />
          ) : null}

          {!isLoading && patients.length ? <div className="preclinic-section-title">Pacientes registrados</div> : null}
          {!isLoading ? (
            <PagedList
              items={patients}
              renderItem={(patient) => (
                <button
                  className={selectedSource.type === "patient" && String(patient.id) === selectedSource.id ? "preclinic-appointment active" : "preclinic-appointment"}
                  key={`patient-${patient.id}`}
                  onClick={() => selectRecord("patient", patient)}
                  type="button"
                >
                  <span>#{patient.patient}</span>
                  <strong>{patient.patient_name}</strong>
                  <small>{patient.patient_dni ? `DNI ${patient.patient_dni}` : patient.doctor_name}</small>
                </button>
              )}
              resetKey={`${selectedDate}|${patientSearch}`}
            />
          ) : null}
        </section>
      </div>

      {isVitalsModalOpen ? (
        <PreclinicVitalsModal
          comparison={comparison}
          form={form}
          isFutureDate={isFutureDate}
          isSaving={isSaving}
          onChange={handleChange}
          onClose={closeVitalsModal}
          onSubmit={saveVitals}
          selectedRecord={selectedRecord}
          selectedSource={selectedSource}
        />
      ) : null}
    </div>
  );
}
