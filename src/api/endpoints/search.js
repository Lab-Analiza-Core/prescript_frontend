import api from "../axios";

export async function searchClinicalRecords(query, { signal } = {}) {
  const response = await api.get("/search", {
    params: { q: query },
    signal,
  });
  return response.data;
}
