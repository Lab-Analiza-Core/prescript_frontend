import { toDateKey, today } from "../../shared/utils/calendarUtils";

export const emptyAppointmentForm = {
  doctor: "",
  patient: "",
  date: "",
  time: "08:00",
  duration_minutes: 30,
  reason: "",
};

export const statusLabels = {
  scheduled: "Confirmada",
  attended: "Atendida",
  cancelled: "Cancelada",
  no_show: "No se presento",
  rescheduled: "Reprogramada",
};

export const statusTone = {
  scheduled: "confirmed",
  attended: "attended",
  cancelled: "cancelled",
  no_show: "cancelled",
  rescheduled: "rescheduled",
};

export const APPOINTMENT_TIME_CONFLICT_MESSAGE =
  "Ese horario ya esta ocupado para este doctor. Elige otra hora disponible para continuar.";

const ACTIVE_APPOINTMENT_STATUSES = new Set(["scheduled", "rescheduled"]);

export const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export const getDefaultAppointmentTime = (dateKey) => (dateKey === today() ? currentTime() : "08:00");

export const toDateTimeLocal = (date, time) => `${date}T${time || "08:00"}:00`;

export const isPastDateTime = (dateKey, time) => {
  if (!dateKey || !time) return false;
  return new Date(toDateTimeLocal(dateKey, time)).getTime() < Date.now();
};

export const addMinutes = (date, minutes) => new Date(date.getTime() + Number(minutes || 30) * 60000);

export const hasAppointmentTimeConflict = ({ appointments, appointmentId, date, doctor, durationMinutes, time }) => {
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

export const getAppointmentDateKey = (appointment) => toDateKey(new Date(appointment.scheduled_at));

export const toTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const buildWhatsAppUrl = (appointment) => {
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

export const getAppointmentErrorMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return "No se pudo guardar la cita.";
  if (typeof data === "string") return data;
  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue)) return firstValue[0];
  return firstValue || data.detail || "No se pudo guardar la cita.";
};
