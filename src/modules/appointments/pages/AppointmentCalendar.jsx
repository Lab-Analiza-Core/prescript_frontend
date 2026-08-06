import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createAppointment, listAppointments, updateAppointment } from "../../../api/endpoints/appointments";
import { listDoctors } from "../../../api/endpoints/doctor";
import { listPatients } from "../../../api/endpoints/patients";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useAuth } from "../../../shared/context/useAuth";

const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const emptyForm = {
  doctor: "",
  patient: "",
  date: "",
  time: "08:00",
  duration_minutes: 30,
  reason: "",
};

const statusLabels = {
  scheduled: "Confirmada",
  attended: "Atendida",
  cancelled: "Cancelada",
  no_show: "No se presento",
  rescheduled: "Reprogramada",
};

const statusTone = {
  scheduled: "confirmed",
  attended: "attended",
  cancelled: "cancelled",
  no_show: "cancelled",
  rescheduled: "rescheduled",
};

const APPOINTMENT_TIME_CONFLICT_MESSAGE =
  "Ese horario ya esta ocupado para este doctor. Elige otra hora disponible para continuar.";
const ACTIVE_APPOINTMENT_STATUSES = new Set(["scheduled", "rescheduled"]);

const pad = (value) => String(value).padStart(2, "0");

const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const today = () => toDateKey(new Date());

const currentTime = () => {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getDefaultAppointmentTime = (dateKey) => (dateKey === today() ? currentTime() : "08:00");

const isPastDateTime = (dateKey, time) => {
  if (!dateKey || !time) return false;
  return new Date(toDateTimeLocal(dateKey, time)).getTime() < Date.now();
};

const addMinutes = (date, minutes) => new Date(date.getTime() + Number(minutes || 30) * 60000);

const hasAppointmentTimeConflict = ({ appointments, appointmentId, date, doctor, durationMinutes, time }) => {
  if (!date || !doctor || !time) return false;
  const nextStart = new Date(toDateTimeLocal(date, time));
  const nextEnd = addMinutes(nextStart, durationMinutes);

  return appointments.some((appointment) => {
    if (appointment.id === appointmentId) return false;
    if (String(appointment.doctor) !== String(doctor)) return false;
    if (!ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) return false;

    const existingStart = new Date(appointment.scheduled_at);
    if (toDateKey(existingStart) !== date) return false;

    const existingEnd = addMinutes(existingStart, appointment.duration_minutes);
    return existingStart < nextEnd && existingEnd > nextStart;
  });
};

const toMonthAnchor = (dateKey) => {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
};

const getMonthRange = (dateKey) => {
  const date = parseDateKey(dateKey);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    first: toDateKey(first),
    last: toDateKey(last),
  };
};

const getMonthLabel = (dateKey) =>
  new Intl.DateTimeFormat("es-HN", {
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey));

const moveMonth = (dateKey, offset) => {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + offset, 1));
};

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

const getAppointmentDateKey = (appointment) => toDateKey(new Date(appointment.scheduled_at));

const toDateTimeLocal = (date, time) => `${date}T${time || "08:00"}:00`;

const toTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const buildWhatsAppUrl = (appointment) => {
  const digits = String(appointment.patient_phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const phone = digits.length === 8 ? `504${digits}` : digits;
  const message = encodeURIComponent(
    `Recordatorio de cita: ${appointment.patient_name}, tiene cita el ${new Date(appointment.scheduled_at).toLocaleDateString("es-HN")} a las ${toTime(
      appointment.scheduled_at,
    )}.`,
  );
  return `https://wa.me/${phone}?text=${message}`;
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return "No se pudo guardar la cita.";
  if (typeof data === "string") return data;
  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue)) return firstValue[0];
  return firstValue || data.detail || "No se pudo guardar la cita.";
};

export function AppointmentCalendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(today());
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthAnchor(today()));
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, date: today() });
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isSecretary = user?.role === "secretary";

  const loadAgenda = async (monthDate = visibleMonth) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { first, last } = getMonthRange(monthDate);
      const [appointmentPayload, patientPayload, doctorPayload] = await Promise.all([
        listAppointments({ dateFrom: first, dateTo: last }),
        listPatients(),
        listDoctors(),
      ]);
      const nextDoctors = Array.isArray(doctorPayload) ? doctorPayload : [];
      setAppointments(Array.isArray(appointmentPayload) ? appointmentPayload : []);
      setPatients(Array.isArray(patientPayload) ? patientPayload : []);
      setDoctors(nextDoctors);
      setForm((current) => ({
        ...current,
        doctor: current.doctor || user?.doctorProfile?.id || nextDoctors[0]?.id || "",
      }));
    } catch {
      setAppointments([]);
      setPatients([]);
      setDoctors([]);
      setErrorMessage("No se pudo cargar la agenda medica.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { first, last } = getMonthRange(visibleMonth);
    Promise.all([listAppointments({ dateFrom: first, dateTo: last }), listPatients(), listDoctors()])
      .then(([appointmentPayload, patientPayload, doctorPayload]) => {
        if (!isMounted) return;
        const nextDoctors = Array.isArray(doctorPayload) ? doctorPayload : [];
        setAppointments(Array.isArray(appointmentPayload) ? appointmentPayload : []);
        setPatients(Array.isArray(patientPayload) ? patientPayload : []);
        setDoctors(nextDoctors);
        setSelectedAppointment(null);
        setForm({
          ...emptyForm,
          date: visibleMonth,
          doctor: user?.doctorProfile?.id || nextDoctors[0]?.id || "",
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setAppointments([]);
        setPatients([]);
        setDoctors([]);
        setErrorMessage("No se pudo cargar la agenda medica.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visibleMonth, user?.doctorProfile?.id]);

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce((grouped, appointment) => {
      const dateKey = getAppointmentDateKey(appointment);
      const next = grouped.get(dateKey) || [];
      next.push(appointment);
      grouped.set(dateKey, next);
      return grouped;
    }, new Map());
  }, [appointments]);

  const selectedAppointments = useMemo(() => {
    return [...(appointmentsByDate.get(selectedDate) || [])].sort(
      (first, second) => new Date(first.scheduled_at).getTime() - new Date(second.scheduled_at).getTime(),
    );
  }, [appointmentsByDate, selectedDate]);

  const eligiblePatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesDoctor = !form.doctor || String(patient.doctor) === String(form.doctor);
      return matchesDoctor && patient.latest_vitals;
    });
  }, [patients, form.doctor]);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const metrics = useMemo(() => {
    const confirmed = selectedAppointments.filter((appointment) => appointment.status === "scheduled").length;
    const rescheduled = selectedAppointments.filter((appointment) => appointment.status === "rescheduled").length;
    return { total: selectedAppointments.length, confirmed, rescheduled };
  }, [selectedAppointments]);

  const isFormInPast = isPastDateTime(form.date || selectedDate, form.time);
  const minAppointmentTime = (form.date || selectedDate) === today() ? currentTime() : undefined;
  const isFormConflicting = hasAppointmentTimeConflict({
    appointments,
    appointmentId: selectedAppointment?.id,
    date: form.date || selectedDate,
    doctor: form.doctor,
    durationMinutes: form.duration_minutes,
    time: form.time,
  });
  const modalErrorMessage = isFormConflicting ? APPOINTMENT_TIME_CONFLICT_MESSAGE : "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (name === "date") {
        const nextTime = value === today() && isPastDateTime(value, current.time) ? currentTime() : current.time;
        return { ...current, date: value, time: nextTime };
      }
      return { ...current, [name]: value };
    });
    setMessage("");
    setErrorMessage("");
  };

  const selectDate = (dateKey) => {
    const monthAnchor = toMonthAnchor(dateKey);
    setSelectedDate(dateKey);
    if (monthAnchor !== visibleMonth) {
      setIsLoading(true);
      setVisibleMonth(monthAnchor);
    }
    setForm((current) => ({ ...current, date: dateKey }));
    setSelectedAppointment(null);
    setMessage("");
    setErrorMessage("");
  };

  const goToMonth = (offset) => {
    const nextMonth = moveMonth(visibleMonth, offset);
    setIsLoading(true);
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
    setForm((current) => ({ ...current, date: nextMonth }));
    setMessage("");
    setErrorMessage("");
  };

  const startNewAppointment = () => {
    const nextDate = selectedDate < today() ? today() : selectedDate;
    setSelectedAppointment(null);
    setForm({
      ...emptyForm,
      date: nextDate,
      time: getDefaultAppointmentTime(nextDate),
      doctor: user?.doctorProfile?.id || doctors[0]?.id || "",
    });
    setIsAppointmentModalOpen(true);
    setMessage("");
    setErrorMessage("");
  };

  const selectAppointment = (appointment) => {
    const scheduledAt = new Date(appointment.scheduled_at);
    const appointmentDate = getAppointmentDateKey(appointment);
    setSelectedAppointment(appointment);
    setSelectedDate(appointmentDate);
    setForm({
      doctor: appointment.doctor,
      patient: appointment.patient,
      date: appointmentDate,
      time: scheduledAt.toTimeString().slice(0, 5),
      duration_minutes: appointment.duration_minutes,
      reason: appointment.reason || "",
    });
    setIsAppointmentModalOpen(true);
    setMessage("");
    setErrorMessage("");
  };

  const closeAppointmentModal = () => {
    setIsAppointmentModalOpen(false);
    setSelectedAppointment(null);
    setForm({
      ...emptyForm,
      date: selectedDate,
      doctor: user?.doctorProfile?.id || doctors[0]?.id || "",
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      if (isPastDateTime(form.date || selectedDate, form.time)) {
        setErrorMessage("No se pueden programar citas en fechas u horas anteriores a la actual.");
        return;
      }
      if (isFormConflicting) {
        setErrorMessage(APPOINTMENT_TIME_CONFLICT_MESSAGE);
        return;
      }
      const payload = {
        doctor: form.doctor || undefined,
        patient: Number(form.patient),
        scheduled_at: toDateTimeLocal(form.date || selectedDate, form.time),
        duration_minutes: Number(form.duration_minutes),
        reason: form.reason,
        status: selectedAppointment ? "rescheduled" : "scheduled",
      };
      const saved = selectedAppointment
        ? await updateAppointment(selectedAppointment.id, payload)
        : await createAppointment(payload);
      const savedDate = getAppointmentDateKey(saved);
      const savedMonth = toMonthAnchor(savedDate);
      setSelectedDate(savedDate);
      setVisibleMonth(savedMonth);
      await loadAgenda(savedDate);
      setSelectedAppointment(null);
      setIsAppointmentModalOpen(false);
      setMessage(selectedAppointment ? "Cita reagendada." : "Cita programada.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAppointment = async (appointment) => {
    setMessage("");
    setErrorMessage("");
    try {
      await updateAppointment(appointment.id, { status: "scheduled" });
      await loadAgenda();
      setMessage("Cita confirmada.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const sendReminder = (appointment) => {
    const url = buildWhatsAppUrl(appointment);
    if (!url) {
      setMessage("");
      setErrorMessage("El paciente no tiene telefono registrado para WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setMessage("Recordatorio preparado para WhatsApp.");
    setErrorMessage("");
  };

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
          <small>{parseDateKey(selectedDate).toLocaleDateString("es-HN")}</small>
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
              <h2>{getMonthLabel(visibleMonth)}</h2>
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
            <span>{parseDateKey(selectedDate).toLocaleDateString("es-HN")}</span>
          </header>

          {isLoading ? <div className="empty-state">Cargando agenda</div> : null}
          {!isLoading && selectedAppointments.length === 0 ? <div className="empty-state">Sin citas para esta fecha</div> : null}
          {!isLoading &&
            selectedAppointments.map((appointment) => (
              <article className="appointment-row" key={appointment.id}>
                <button className="time-pill" onClick={() => selectAppointment(appointment)} type="button">
                  <Clock size={16} aria-hidden="true" />
                  {toTime(appointment.scheduled_at)}
                </button>
                <div>
                  <strong>{appointment.patient_name}</strong>
                  <span>{appointment.reason || appointment.doctor_name}</span>
                </div>
                <div className="appointment-actions">
                  <span className={`status-badge ${statusTone[appointment.status] || ""}`}>{statusLabels[appointment.status] || appointment.status}</span>
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
        <div className="modal-layer" role="presentation">
          <button className="modal-backdrop" onClick={closeAppointmentModal} type="button" aria-label="Cerrar programacion de cita" />
          <section className="appointment-modal" aria-labelledby="appointment-modal-title" role="dialog" aria-modal="true">
            <header className="modal-header">
              <div className="doctor-avatar">
                <CalendarPlus size={22} aria-hidden="true" />
              </div>
              <div>
                <span className="eyebrow">Agenda</span>
                <h2 id="appointment-modal-title">{selectedAppointment ? "Reagendar cita" : "Programar cita"}</h2>
              </div>
              <button className="icon-button" onClick={closeAppointmentModal} type="button" aria-label="Cerrar">
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <form className="modal-form appointment-modal-form" onSubmit={handleSave}>
              <label className="field-wide">
                <span>Doctor</span>
                <select disabled={!isSecretary} name="doctor" onChange={handleChange} required value={form.doctor}>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-wide">
                <span>Paciente con preclinica</span>
                <select name="patient" onChange={handleChange} required value={form.patient}>
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
                <input min={today()} name="date" onChange={handleChange} required type="date" value={form.date} />
              </label>
              <label>
                <span>Hora</span>
                <input min={minAppointmentTime} name="time" onChange={handleChange} required type="time" value={form.time} />
              </label>

              <label>
                <span>Duracion</span>
                <input min="10" name="duration_minutes" onChange={handleChange} step="5" type="number" value={form.duration_minutes} />
              </label>
              <label>
                <span>Motivo</span>
                <input maxLength="255" name="reason" onChange={handleChange} placeholder="Control, seguimiento, consulta" value={form.reason} />
              </label>

              {modalErrorMessage ? <p className="form-error field-wide">{modalErrorMessage}</p> : null}

              <div className="modal-actions">
                <button className="secondary-action compact" onClick={closeAppointmentModal} type="button">
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
      ) : null}
    </div>
  );
}
