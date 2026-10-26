import { toDateKey, today } from "../../shared/utils/calendarUtils";
import { getCountryLocale } from "../../shared/utils/countryUtils";
import { getCountryFieldFormat } from "../../shared/utils/fieldMasks";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  addMinutes,
  hasAppointmentTimeConflict,
} from "./appointmentConflict.js";

export { ACTIVE_APPOINTMENT_STATUSES, addMinutes, hasAppointmentTimeConflict };

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
  superseded: "Reprogramada · anterior",
};

export const statusTone = {
  scheduled: "confirmed",
  attended: "attended",
  cancelled: "cancelled",
  no_show: "cancelled",
  rescheduled: "rescheduled",
  superseded: "rescheduled",
};

export const APPOINTMENT_TIME_CONFLICT_MESSAGE =
  "Ese horario ya esta ocupado para este doctor. Elige otra hora disponible para continuar.";

export const currentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export const getDefaultAppointmentTime = (dateKey) => (dateKey === today() ? currentTime() : "08:00");

export const getSuggestedAppointmentStart = () => {
  const suggested = new Date(Date.now() + 30 * 60000);
  suggested.setSeconds(0, 0);
  suggested.setMinutes(Math.ceil(suggested.getMinutes() / 5) * 5);
  return {
    date: toDateKey(suggested),
    time: `${String(suggested.getHours()).padStart(2, "0")}:${String(suggested.getMinutes()).padStart(2, "0")}`,
  };
};

export const toDateTimeLocal = (date, time) => `${date}T${time || "08:00"}:00`;

export const isPastDateTime = (dateKey, time) => {
  if (!dateKey || !time) return false;
  return new Date(toDateTimeLocal(dateKey, time)).getTime() < Date.now();
};

export const isAppointmentPastDue = (appointment) => {
  if (!appointment || !ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) return false;
  const appointmentEnd = addMinutes(new Date(appointment.scheduled_at), appointment.duration_minutes);
  return appointmentEnd.getTime() <= Date.now();
};

export const getAppointmentDateKey = (appointment) => toDateKey(new Date(appointment.scheduled_at));

export const toTime = (value, locale = "es-HN") => {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const buildWhatsAppUrl = (appointment, country) => {
  const digits = String(appointment.patient_phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const { phoneCode } = getCountryFieldFormat(country);
  const countryDigits = String(phoneCode || "").replace(/\D/g, "");
  const phone = digits.length === 8 && countryDigits ? `${countryDigits}${digits}` : digits;
  const locale = getCountryLocale(country);
  const message = encodeURIComponent(
    `Recordatorio de cita: ${appointment.patient_name}, tiene cita el ${new Date(appointment.scheduled_at).toLocaleDateString(locale)} a las ${toTime(
      appointment.scheduled_at, locale,
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
