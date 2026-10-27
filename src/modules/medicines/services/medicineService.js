import api from "../../../api/axios";

// Catalogo del medico: sincronizado (Interactive Core) o propio (externo), con la misma forma.
export async function listDoctorCatalog({ search = "", category = "", page } = {}) {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (page) params.page = page;
  const response = await api.get("/doctor/medicine-catalog", { params });
  return response.data;
}

// Catalogo propio (solo medicos externos).
export async function createOwnMedicine(payload) {
  const response = await api.post("/doctor/medicines", payload);
  return response.data;
}

export async function updateOwnMedicine(medicineId, payload) {
  const response = await api.patch(`/doctor/medicines/${medicineId}`, payload);
  return response.data;
}

export async function deleteOwnMedicine(medicineId) {
  await api.delete(`/doctor/medicines/${medicineId}`);
}

// Preferencias sobre el catalogo sincronizado (medicos de Interactive Core).
export async function createMedicinePreference(payload) {
  const response = await api.post("/doctor/medicine-preferences", payload);
  return response.data;
}

export async function updateMedicinePreference(preferenceId, payload) {
  const response = await api.patch(`/doctor/medicine-preferences/${preferenceId}`, payload);
  return response.data;
}

// Cambia la categoria de una entrada del catalogo sin importar su origen.
export function setEntryCategory(entry, category) {
  if (entry.source === "own") return updateOwnMedicine(entry.doctor_medicine, { category });
  if (entry.preference_id) return updateMedicinePreference(entry.preference_id, { category });
  return createMedicinePreference({ medicine: entry.medicine, category });
}
