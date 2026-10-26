import api from "../../../api/axios";

export async function listPreclinicAppointments(date, { signal } = {}) {
  const response = await api.get("/preclinic/appointments", {
    params: date ? { date } : undefined,
    signal,
  });
  return response.data;
}

export async function listPreclinicPatients({ date, search, signal } = {}) {
  const response = await api.get("/preclinic/patients", {
    params: { date, search },
    signal,
  });
  return response.data;
}

export async function savePreclinicVitals(appointmentId, payload) {
  const response = await api.patch(`/preclinic/appointments/${appointmentId}/vitals`, payload);
  return response.data;
}

export async function savePreclinicPatientVitals(patientId, payload, date) {
  const response = await api.patch(`/preclinic/patients/${patientId}/vitals`, payload, {
    params: date ? { date } : undefined,
  });
  return response.data;
}
