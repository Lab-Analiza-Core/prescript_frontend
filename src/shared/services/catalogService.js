import api from "../../api/axios";

export async function getCurrentTerms() {
  const response = await api.get("/auth/terms/current");
  return response.data;
}

export async function listPublicDivisions(countryCode) {
  const response = await api.get("/auth/catalog/divisions", { params: { country: countryCode } });
  return response.data;
}

export async function listPublicSpecialties(countryCode) {
  const response = await api.get("/auth/catalog/specialties", { params: { country: countryCode } });
  return response.data;
}
