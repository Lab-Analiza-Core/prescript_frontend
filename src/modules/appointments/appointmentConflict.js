export const ACTIVE_APPOINTMENT_STATUSES = new Set(["scheduled", "rescheduled"]);

export const addMinutes = (date, minutes) => new Date(date.getTime() + Number(minutes || 30) * 60000);

const toDateTimeLocal = (date, time) => `${date}T${time || "08:00"}:00`;

export const hasAppointmentTimeConflict = ({ appointments, appointmentId, date, doctor, durationMinutes, time }) => {
  if (!date || !doctor || !time) return false;
  const nextStart = new Date(toDateTimeLocal(date, time));
  const nextEnd = addMinutes(nextStart, durationMinutes);

  return appointments.some((appointment) => {
    if (appointment.id === appointmentId) return false;
    if (String(appointment.doctor) !== String(doctor)) return false;
    if (!ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) return false;

    const existingStart = new Date(appointment.scheduled_at);
    const existingEnd = addMinutes(existingStart, appointment.duration_minutes);
    return existingStart < nextEnd && existingEnd > nextStart;
  });
};
