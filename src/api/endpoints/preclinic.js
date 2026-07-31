import api from "../axios";

export async function listPreclinicAppointments(date) {
  const response = await api.get("/preclinic/appointments", {
    params: date ? { date } : undefined,
  });
  return response.data;
}

export async function listPreclinicPatients({ date, search } = {}) {
  const response = await api.get("/preclinic/patients", {
    params: { date, search },
  });
  return response.data;
}

export async function savePreclinicVitals(appointmentId, payload) {
  const response = await api.patch(`/preclinic/appointments/${appointmentId}/vitals`, payload);
  return response.data;
}

export async function savePreclinicPatientVitals(patientId, payload) {
  const response = await api.patch(`/preclinic/patients/${patientId}/vitals`, payload);
  return response.data;
}
