import api from "../../api/axios";

export async function getEffectiveTheme() {
  const response = await api.get("/theme");
  return response.data;
}

const themePath = (organizationId) => (organizationId ? `/admin/organizations/${organizationId}/theme` : "/admin/theme");

export async function getThemeOptions() {
  const response = await api.get("/admin/theme/options");
  return response.data;
}

export async function listThemeOrganizations(search = "") {
  const response = await api.get("/admin/theme/organizations", { params: search ? { search } : {} });
  return response.data;
}

export async function getTheme(organizationId) {
  const response = await api.get(themePath(organizationId));
  return response.data;
}

export async function saveTheme(organizationId, payload) {
  const response = await api.put(themePath(organizationId), payload);
  return response.data;
}

export async function resetTheme(organizationId) {
  const response = await api.delete(themePath(organizationId));
  return response.data;
}

export async function uploadThemeLogo(organizationId, file) {
  const body = new FormData();
  body.append("logo", file);
  const response = await api.post(`${themePath(organizationId)}/logo`, body);
  return response.data;
}

export async function removeThemeLogo(organizationId) {
  const response = await api.delete(`${themePath(organizationId)}/logo`);
  return response.data;
}
