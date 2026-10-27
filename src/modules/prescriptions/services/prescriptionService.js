import api from "../../../api/axios";

export async function createPrescription(payload) {
  const response = await api.post("/prescriptions", payload);
  return response.data;
}

export async function listPatientPrescriptions(patientId) {
  const response = await api.get("/prescriptions", { params: { patient: patientId } });
  return response.data;
}
