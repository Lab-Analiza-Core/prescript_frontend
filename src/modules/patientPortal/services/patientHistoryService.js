import api from "../../../api/axios";

export async function requestPatientHistoryCode() {
  const response = await api.post("/patient/history/request");
  return response.data;
}

export async function verifyPatientHistory(code) {
  const response = await api.post("/patient/history/verify", { code });
  return response.data;
}

export async function getPatientHistory() {
  const response = await api.get("/patient/me/history");
  return response.data;
}
