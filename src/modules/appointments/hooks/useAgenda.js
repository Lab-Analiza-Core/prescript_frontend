import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createAppointment,
  listAppointments,
  reschedulePastAppointment,
  updateAppointment,
} from "../../../api/endpoints/appointments";
import { listDoctors } from "../../../api/endpoints/doctor";
import { listPatients } from "../../../api/endpoints/patients";
import {
  getCalendarDays,
  getMonthRange,
  moveMonth,
  toMonthAnchor,
  today,
} from "../../../shared/utils/calendarUtils";
import {
  APPOINTMENT_TIME_CONFLICT_MESSAGE,
  ACTIVE_APPOINTMENT_STATUSES,
  buildWhatsAppUrl,
  currentTime,
  emptyAppointmentForm,
  getAppointmentDateKey,
  getAppointmentErrorMessage,
  getDefaultAppointmentTime,
  getSuggestedAppointmentStart,
  hasAppointmentTimeConflict,
  isAppointmentPastDue,
  isPastDateTime,
  statusLabels,
  statusTone,
  toDateTimeLocal,
} from "../appointmentUtils";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function useAgenda(user, focusedDate) {
  const initialDate = DATE_KEY_PATTERN.test(focusedDate || "") ? focusedDate : today();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthAnchor(initialDate));
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentAction, setAppointmentAction] = useState(null);
  const [form, setForm] = useState({ ...emptyAppointmentForm, date: initialDate });
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingAppointmentStatus, setIsUpdatingAppointmentStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isSecretary = user?.role === "secretary";

  const loadAgenda = useCallback(
    async (monthDate, { resetForm = false } = {}) => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const { first, last } = getMonthRange(monthDate);
        const [appointmentPayload, pendingPayload, patientPayload, doctorPayload] = await Promise.all([
          listAppointments({ dateFrom: first, dateTo: last }),
          listAppointments({ pendingClosure: true }),
          listPatients(),
          listDoctors(),
        ]);
        const nextDoctors = Array.isArray(doctorPayload) ? doctorPayload : [];
        setAppointments(Array.isArray(appointmentPayload) ? appointmentPayload : []);
        setPendingAppointments(Array.isArray(pendingPayload) ? pendingPayload : []);
        setPatients(Array.isArray(patientPayload) ? patientPayload : []);
        setDoctors(nextDoctors);
        if (resetForm) {
          setSelectedAppointment(null);
        }
        setForm((current) =>
          resetForm
            ? {
                ...emptyAppointmentForm,
                date: monthDate,
                doctor: user?.doctorProfile?.id || nextDoctors[0]?.id || "",
              }
            : {
                ...current,
                doctor: current.doctor || user?.doctorProfile?.id || nextDoctors[0]?.id || "",
              },
        );
      } catch {
        setAppointments([]);
        setPendingAppointments([]);
        setPatients([]);
        setDoctors([]);
        setErrorMessage("No se pudo cargar la agenda medica.");
      } finally {
        setIsLoading(false);
      }
    },
    [user?.doctorProfile?.id],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAgenda(visibleMonth, { resetForm: true });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAgenda, visibleMonth]);

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

  const pendingClosureAppointments = useMemo(() => {
    return pendingAppointments
      .filter(isAppointmentPastDue)
      .sort((first, second) => new Date(second.scheduled_at).getTime() - new Date(first.scheduled_at).getTime());
  }, [pendingAppointments]);

  const eligiblePatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesDoctor = !form.doctor || String(patient.doctor) === String(form.doctor);
      return matchesDoctor && patient.latest_vitals;
    });
  }, [patients, form.doctor]);

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const metrics = useMemo(() => {
    const active = selectedAppointments.filter(
      (appointment) => ACTIVE_APPOINTMENT_STATUSES.has(appointment.status) && !isAppointmentPastDue(appointment),
    ).length;
    const cancelled = selectedAppointments.filter((appointment) => appointment.status === "cancelled").length;
    return { total: selectedAppointments.length, active, pending: pendingClosureAppointments.length, cancelled };
  }, [pendingClosureAppointments.length, selectedAppointments]);

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
  const modalErrorMessage = isFormConflicting
    ? APPOINTMENT_TIME_CONFLICT_MESSAGE
    : isAppointmentModalOpen
      ? errorMessage
      : "";

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
      ...emptyAppointmentForm,
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
    const isPastDue = isAppointmentPastDue(appointment);
    const suggestedStart = isPastDue ? getSuggestedAppointmentStart() : null;
    setSelectedAppointment(appointment);
    setSelectedDate(appointmentDate);
    setForm({
      doctor: appointment.doctor,
      patient: appointment.patient,
      date: suggestedStart?.date || appointmentDate,
      time: suggestedStart?.time || scheduledAt.toTimeString().slice(0, 5),
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
      ...emptyAppointmentForm,
      date: selectedDate,
      doctor: user?.doctorProfile?.id || doctors[0]?.id || "",
    });
  };

  const saveAppointment = async (event) => {
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
      const isPastDueReschedule = isAppointmentPastDue(selectedAppointment);
      let saved;
      if (isPastDueReschedule) {
        saved = await reschedulePastAppointment(selectedAppointment.id, payload);
      } else if (selectedAppointment) {
        saved = await updateAppointment(selectedAppointment.id, payload);
      } else {
        saved = await createAppointment(payload);
      }
      const savedDate = getAppointmentDateKey(saved);
      const savedMonth = toMonthAnchor(savedDate);
      setSelectedDate(savedDate);
      setVisibleMonth(savedMonth);
      await loadAgenda(savedDate);
      setSelectedAppointment(null);
      setIsAppointmentModalOpen(false);
      setMessage(
        isPastDueReschedule
          ? "Cita anterior cerrada y nueva cita programada."
          : selectedAppointment
            ? "Cita reprogramada."
            : "Cita programada.",
      );
    } catch (error) {
      setErrorMessage(getAppointmentErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAppointment = async (appointment) => {
    setMessage("");
    setErrorMessage("");
    try {
      await updateAppointment(appointment.id, { status: "scheduled" });
      await loadAgenda(visibleMonth);
      setMessage("Cita confirmada.");
    } catch (error) {
      setErrorMessage(getAppointmentErrorMessage(error));
    }
  };

  const requestAppointmentStatus = (appointment, status) => {
    const isPastDue = isAppointmentPastDue(appointment);
    const isAllowed = status === "cancelled"
      ? ACTIVE_APPOINTMENT_STATUSES.has(appointment?.status) && !isPastDue
      : ["attended", "no_show"].includes(status) && isPastDue;
    if (!isAllowed) return;
    setAppointmentAction({ appointment, status });
    setMessage("");
    setErrorMessage("");
  };

  const closeAppointmentStatusDialog = () => {
    if (isUpdatingAppointmentStatus) return;
    setAppointmentAction(null);
  };

  const confirmAppointmentStatus = async () => {
    if (!appointmentAction) return;
    setIsUpdatingAppointmentStatus(true);
    setMessage("");
    setErrorMessage("");
    try {
      await updateAppointment(appointmentAction.appointment.id, { status: appointmentAction.status });
      const changedSelectedAppointment = selectedAppointment?.id === appointmentAction.appointment.id;
      await loadAgenda(visibleMonth);
      if (changedSelectedAppointment) {
        setSelectedAppointment(null);
        setIsAppointmentModalOpen(false);
      }
      const successMessages = {
        attended: "Cita cerrada como atendida.",
        cancelled: "Cita cancelada. El horario vuelve a estar disponible.",
        no_show: "Cita cerrada como no presentada.",
      };
      setMessage(successMessages[appointmentAction.status]);
      setAppointmentAction(null);
    } catch (error) {
      setErrorMessage(getAppointmentErrorMessage(error));
      setAppointmentAction(null);
    } finally {
      setIsUpdatingAppointmentStatus(false);
    }
  };

  const sendReminder = (appointment) => {
    const url = buildWhatsAppUrl(appointment, user?.country);
    if (!url) {
      setMessage("");
      setErrorMessage("El paciente no tiene telefono registrado para WhatsApp.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setMessage("Recordatorio preparado para WhatsApp.");
    setErrorMessage("");
  };

  return {
    appointmentsByDate,
    appointmentAction,
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
    selectedAppointments,
    selectedDate,
    sendReminder,
    startNewAppointment,
    requestAppointmentStatus,
    statusLabels,
    statusTone,
    visibleMonth,
  };
}
