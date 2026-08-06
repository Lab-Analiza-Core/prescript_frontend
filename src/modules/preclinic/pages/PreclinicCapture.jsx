import { CalendarClock, ChevronLeft, ChevronRight, FileText, Save, Stethoscope, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  listPreclinicAppointments,
  listPreclinicPatients,
  savePreclinicPatientVitals,
  savePreclinicVitals,
} from "../../../api/endpoints/preclinic";
import { PageHeader } from "../../../shared/components/PageHeader";

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const pad = (value) => String(value).padStart(2, "0");

const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const today = () => toDateKey(new Date());

const toMonthAnchor = (dateKey) => {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
};

const moveMonth = (dateKey, offset) => {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + offset, 1));
};

const getMonthLabel = (dateKey) =>
  new Intl.DateTimeFormat("es-HN", {
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey));

const getCalendarDays = (dateKey) => {
  const date = parseDateKey(dateKey);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const leadingDays = (first.getDay() + 6) % 7;
  const days = [];

  for (let index = 0; index < leadingDays; index += 1) {
    days.push({ key: `empty-${index}`, isEmpty: true });
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const current = new Date(date.getFullYear(), date.getMonth(), day);
    days.push({
      key: toDateKey(current),
      dateKey: toDateKey(current),
      day,
    });
  }

  return days;
};

const emptyVitals = {
  blood_pressure_systolic: "",
  blood_pressure_diastolic: "",
  oxygen_saturation: "",
  temperature: "",
  height_cm: "",
  weight_kg: "",
};

const toFormValue = (value) => (value === null || value === undefined ? "" : String(value));

const buildForm = (record) => {
  const current = record?.current_vitals || {};
  const comparison = record?.comparison_vitals || {};
  return {
    blood_pressure_systolic: toFormValue(current.blood_pressure_systolic ?? comparison.blood_pressure_systolic),
    blood_pressure_diastolic: toFormValue(current.blood_pressure_diastolic ?? comparison.blood_pressure_diastolic),
    oxygen_saturation: toFormValue(current.oxygen_saturation),
    temperature: toFormValue(current.temperature),
    height_cm: record?.is_pediatric ? toFormValue(current.height_cm ?? comparison.height_cm) : "",
    weight_kg: toFormValue(current.weight_kg ?? comparison.weight_kg),
  };
};

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

const formatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export function PreclinicCapture() {
  const todayDate = today();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedSource, setSelectedSource] = useState({ type: "", id: "" });
  const [form, setForm] = useState(emptyVitals);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthAnchor(todayDate));
  const [patientSearch, setPatientSearch] = useState("");
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isFutureDate = selectedDate > todayDate;

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      listPreclinicAppointments(selectedDate),
      listPreclinicPatients({ date: selectedDate, search: patientSearch }),
    ])
      .then(([appointmentPayload, patientPayload]) => {
        if (!isMounted) return;
        const appointmentRows = Array.isArray(appointmentPayload) ? appointmentPayload : [];
        const patientRows = Array.isArray(patientPayload) ? patientPayload : [];
        const nextSelection = appointmentRows[0] ? { ...appointmentRows[0], source: "appointment" } : patientRows[0] || null;
        setAppointments(appointmentRows);
        setPatients(patientRows);
        setSelectedSource(nextSelection ? { type: nextSelection.source || "appointment", id: String(nextSelection.id) } : { type: "", id: "" });
        setForm(nextSelection ? buildForm(nextSelection) : emptyVitals);
      })
      .catch(() => {
        if (isMounted) {
          setAppointments([]);
          setPatients([]);
          setSelectedSource({ type: "", id: "" });
          setForm(emptyVitals);
          setErrorMessage("No se pudo cargar preclinica.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, patientSearch]);

  const selectedRecord = useMemo(() => {
    if (selectedSource.type === "appointment") {
      return appointments.find((appointment) => String(appointment.id) === selectedSource.id);
    }
    return patients.find((patient) => String(patient.id) === selectedSource.id);
  }, [appointments, patients, selectedSource]);

  const comparison = selectedRecord?.comparison_vitals;
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const completedCount = useMemo(() => {
    const records = [...appointments, ...patients];
    return records.filter((record) => Boolean(record.current_vitals)).length;
  }, [appointments, patients]);
  const totalRecords = appointments.length + patients.length;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectDate = (dateKey) => {
    const nextDate = dateKey > todayDate ? todayDate : dateKey;
    const monthAnchor = toMonthAnchor(nextDate);
    setSelectedDate(nextDate);
    if (monthAnchor !== visibleMonth) {
      setVisibleMonth(monthAnchor);
    }
    setIsLoading(true);
    setIsVitalsModalOpen(false);
    setMessage("");
    setErrorMessage("");
  };

  const goToMonth = (offset) => {
    const nextMonth = moveMonth(visibleMonth, offset);
    const nextDate = nextMonth > todayDate ? todayDate : nextMonth;
    setVisibleMonth(toMonthAnchor(nextDate));
    setSelectedDate(nextDate);
    setIsLoading(true);
    setIsVitalsModalOpen(false);
    setMessage("");
    setErrorMessage("");
  };

  const selectRecord = (type, record) => {
    setSelectedSource({ type, id: String(record.id) });
    setForm(buildForm(record));
    setIsVitalsModalOpen(true);
    setMessage("");
    setErrorMessage("");
  };

  const closeVitalsModal = () => {
    setIsVitalsModalOpen(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedRecord) return;
    if (isFutureDate) {
      setMessage("");
      setErrorMessage("No se pueden agregar datos de preclinica en fechas futuras.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      const payload = {
        blood_pressure_systolic: numberOrNull(form.blood_pressure_systolic),
        blood_pressure_diastolic: numberOrNull(form.blood_pressure_diastolic),
        oxygen_saturation: numberOrNull(form.oxygen_saturation),
        temperature: numberOrNull(form.temperature),
        height_cm: selectedRecord.is_pediatric ? numberOrNull(form.height_cm) : null,
        weight_kg: numberOrNull(form.weight_kg),
      };
      const updated =
        selectedSource.type === "appointment"
          ? await savePreclinicVitals(selectedRecord.id, payload)
          : await savePreclinicPatientVitals(selectedRecord.patient, payload, selectedDate);

      if (selectedSource.type === "appointment") {
        setAppointments((current) => current.map((appointment) => (appointment.id === updated.id ? updated : appointment)));
      } else {
        setPatients((current) => current.map((patient) => (patient.id === updated.id ? updated : patient)));
      }
      setForm(buildForm(updated));
      setMessage("Signos vitales guardados en el expediente del paciente.");
      setIsVitalsModalOpen(false);
    } catch (error) {
      setErrorMessage(error?.response?.data?.date || "No se pudieron guardar los signos vitales.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack preclinic-page">
      <PageHeader eyebrow="Preclinica" title="Signos vitales">
        Captura clinica asociada al expediente del paciente registrado.
      </PageHeader>

      <div className="metric-grid preclinic-metrics">
        <div className="metric-card">
          <span>Citas de la fecha</span>
          <strong>{appointments.length}</strong>
          <small>{parseDateKey(selectedDate).toLocaleDateString("es-HN")}</small>
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
              <h2>{getMonthLabel(visibleMonth)}</h2>
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
            <span>{parseDateKey(selectedDate).toLocaleDateString("es-HN")}</span>
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
          {!isLoading &&
            appointments.map((appointment) => (
              <button
                className={selectedSource.type === "appointment" && String(appointment.id) === selectedSource.id ? "preclinic-appointment active" : "preclinic-appointment"}
                key={`appointment-${appointment.id}`}
                onClick={() => selectRecord("appointment", appointment)}
                type="button"
              >
                <span>{formatTime(appointment.scheduled_at)}</span>
                <strong>{appointment.patient_name}</strong>
                <small>{appointment.patient_dni ? `DNI ${appointment.patient_dni}` : `Paciente #${appointment.patient}`}</small>
              </button>
            ))}

          {!isLoading && patients.length ? <div className="preclinic-section-title">Pacientes registrados</div> : null}
          {!isLoading &&
            patients.map((patient) => (
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
            ))}
        </section>
      </div>

      {isVitalsModalOpen ? (
        <div className="modal-layer" role="presentation">
          <button className="modal-backdrop" onClick={closeVitalsModal} type="button" aria-label="Cerrar captura de signos" />
          <section className="preclinic-modal" aria-labelledby="preclinic-modal-title" role="dialog" aria-modal="true">
            <header className="modal-header">
              <div className="doctor-avatar">
                <Stethoscope size={22} aria-hidden="true" />
              </div>
              <div>
                <span className="eyebrow">Preclinica</span>
                <h2 id="preclinic-modal-title">{selectedRecord?.patient_name || "Signos vitales"}</h2>
              </div>
              <button className="icon-button" onClick={closeVitalsModal} type="button" aria-label="Cerrar">
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <div className="preclinic-modal-summary">
              <div className="preclinic-patient">
                <Stethoscope size={20} aria-hidden="true" />
                <div>
                  <strong>{selectedRecord?.patient_name || "Seleccione un paciente registrado"}</strong>
                  {selectedRecord ? (
                    <span>{`Paciente registrado #${selectedRecord.patient}${selectedRecord.patient_dni ? ` - DNI ${selectedRecord.patient_dni}` : ""}`}</span>
                  ) : null}
                </div>
                {selectedRecord ? (
                  <Link className="secondary-action compact preclinic-patient-link" to={`/app/pacientes/${selectedRecord.patient}`}>
                    <FileText size={17} aria-hidden="true" />
                    Expediente
                  </Link>
                ) : null}
              </div>

              {selectedRecord ? (
                <div className="preclinic-context">
                  <span>{selectedSource.type === "appointment" ? selectedRecord.reason || "Sin motivo registrado" : "Captura sin cita"}</span>
                  <span>{selectedRecord.doctor_name}</span>
                  <span>{selectedRecord.is_pediatric ? "Altura habilitada por pediatria" : "Altura no aplica para esta especialidad"}</span>
                </div>
              ) : null}
            </div>

            <form className="form-grid preclinic-form preclinic-modal-form" onSubmit={handleSave}>
              <div className="auth-grid">
                <label>
                  <span>Presion sistolica</span>
                  <input name="blood_pressure_systolic" onChange={handleChange} type="number" value={form.blood_pressure_systolic} />
                  <small>Previo: {comparison?.blood_pressure_systolic || "sin dato"}</small>
                </label>

                <label>
                  <span>Presion diastolica</span>
                  <input name="blood_pressure_diastolic" onChange={handleChange} type="number" value={form.blood_pressure_diastolic} />
                  <small>Previo: {comparison?.blood_pressure_diastolic || "sin dato"}</small>
                </label>
              </div>

              <div className="auth-grid">
                <label>
                  <span>Oxigenacion</span>
                  <input max="100" min="0" name="oxygen_saturation" onChange={handleChange} step="0.1" type="number" value={form.oxygen_saturation} />
                  <small>Solo captura actual</small>
                </label>

                <label>
                  <span>Temperatura</span>
                  <input name="temperature" onChange={handleChange} step="0.1" type="number" value={form.temperature} />
                  <small>Solo captura actual</small>
                </label>
              </div>

              <div className="auth-grid">
                <label>
                  <span>Altura</span>
                  <input disabled={!selectedRecord?.is_pediatric} name="height_cm" onChange={handleChange} step="0.1" type="number" value={form.height_cm} />
                  <small>{selectedRecord?.is_pediatric ? `Previo: ${comparison?.height_cm || "sin dato"}` : "Solo pediatria"}</small>
                </label>

                <label>
                  <span>Peso</span>
                  <input name="weight_kg" onChange={handleChange} step="0.1" type="number" value={form.weight_kg} />
                  <small>Previo: {comparison?.weight_kg || "sin dato"}</small>
                </label>
              </div>

              <div className="modal-actions">
                <button className="secondary-action compact" onClick={closeVitalsModal} type="button">
                  Cancelar
                </button>
                <button className="primary-action compact" disabled={!selectedRecord || isSaving || isFutureDate} type="submit">
                  <Save size={18} aria-hidden="true" />
                  {isSaving ? "Guardando" : "Guardar signos"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
