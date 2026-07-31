import api from "../axios";

export async function getDoctorProfile() {
  const response = await api.get("/doctor/me");
  return response.data;
}

export async function updateDoctorProfile(payload) {
  const response = await api.patch("/doctor/me", payload);
  return response.data;
}
