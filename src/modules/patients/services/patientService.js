import api from "../../../api/axios";

export async function listPatients(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.doctor) params.set("doctor", filters.doctor);
  if (filters.sex) params.set("sex", filters.sex);
  if (filters.isActive) params.set("is_active", filters.isActive);
  if (filters.createdFrom) params.set("created_from", filters.createdFrom);
  if (filters.createdTo) params.set("created_to", filters.createdTo);
  if (filters.page) params.set("page", filters.page);

  const query = params.toString();
  const response = await api.get(`/patients${query ? `?${query}` : ""}`);
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
