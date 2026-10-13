import api from "../axios";

export async function listAppointments({ dateFrom, dateTo, pendingClosure } = {}) {
  const response = await api.get("/appointments", {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
      pending_closure: pendingClosure ? "true" : undefined,
    },
  });
  return response.data;
}

export async function createAppointment(payload) {
  const response = await api.post("/appointments", payload);
  return response.data;
}

export async function updateAppointment(appointmentId, payload) {
  const response = await api.patch(`/appointments/${appointmentId}`, payload);
  return response.data;
}

export async function reschedulePastAppointment(appointmentId, payload) {
  const response = await api.post(`/appointments/${appointmentId}/reschedule`, payload);
  return response.data;
}
