import { useEffect, useMemo, useState } from "react";

import {
  listPreclinicAppointments,
  listPreclinicPatients,
  savePreclinicPatientVitals,
  savePreclinicVitals,
} from "../services/preclinicService";
import {
  getCalendarDays,
  moveMonth,
  toMonthAnchor,
  today,
} from "../../../shared/utils/calendarUtils";
import { buildVitalsForm, emptyVitals, medicalListFromText, numberOrNull } from "../preclinicUtils";

export function usePreclinicCapture() {
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
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      Promise.all([
        listPreclinicAppointments(selectedDate, { signal: controller.signal }),
        listPreclinicPatients({ date: selectedDate, search: patientSearch, signal: controller.signal }),
      ])
        .then(([appointmentPayload, patientPayload]) => {
          if (!isMounted) return;
          const appointmentRows = Array.isArray(appointmentPayload) ? appointmentPayload : [];
          const patientRows = Array.isArray(patientPayload) ? patientPayload : [];
          const nextSelection = appointmentRows[0] ? { ...appointmentRows[0], source: "appointment" } : patientRows[0] || null;
          setAppointments(appointmentRows);
          setPatients(patientRows);
          setSelectedSource(nextSelection ? { type: nextSelection.source || "appointment", id: String(nextSelection.id) } : { type: "", id: "" });
          setForm(nextSelection ? buildVitalsForm(nextSelection) : emptyVitals);
          setErrorMessage("");
        })
        .catch((error) => {
          if (isMounted && error.code !== "ERR_CANCELED") {
            setAppointments([]);
            setPatients([]);
            setSelectedSource({ type: "", id: "" });
            setForm(emptyVitals);
            setErrorMessage("No se pudo cargar preclinica.");
          }
        })
        .finally(() => {
          if (isMounted && !controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
      controller.abort();
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
    setForm(buildVitalsForm(record));
    setIsVitalsModalOpen(true);
    setMessage("");
    setErrorMessage("");
  };

  const closeVitalsModal = () => {
    setIsVitalsModalOpen(false);
  };

  const saveVitals = async (event) => {
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
        medical_profile: {
          allergies: medicalListFromText(form.allergies),
          chronic_conditions: medicalListFromText(form.chronic_conditions),
          blood_type: form.blood_type || null,
          clinical_notes: form.clinical_notes.trim() || null,
        },
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
      setForm(buildVitalsForm(updated));
      setMessage("Preclinica y expediente medico guardados correctamente.");
      setIsVitalsModalOpen(false);
    } catch (error) {
      setErrorMessage(error?.response?.data?.date || error?.response?.data?.detail || "No se pudo guardar la preclinica.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
}
