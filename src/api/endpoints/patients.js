import api from "../axios";

export async function listPatients() {
  const response = await api.get("/patients");
  return response.data;
}

export async function getPatient(patientId) {
  const response = await api.get(`/patients/${patientId}`);
  return response.data;
}

export async function createPatient(payload) {
  const response = await api.post("/patients", payload);
  return response.data;
}

export async function updatePatient(patientId, payload) {
  const response = await api.patch(`/patients/${patientId}`, payload);
  return response.data;
}

export async function deactivatePatient(patientId) {
  const response = await api.patch(`/patients/${patientId}`, { is_active: false });
  return response.data;
}
