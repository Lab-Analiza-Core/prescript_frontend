import api from "../axios";

export async function listUsers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.role) params.set("role", filters.role);
  if (filters.isActive) params.set("is_active", filters.isActive);

  const query = params.toString();
  const response = await api.get(`/admin/users${query ? `?${query}` : ""}`);
  return response.data;
}

export async function createUser(payload) {
  const response = await api.post("/admin/users", payload);
  return response.data;
}

export async function updateUser(userId, payload) {
  const response = await api.patch(`/admin/users/${userId}`, payload);
  return response.data;
}

export async function deactivateUser(userId) {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
}

export async function resetUserPassword(userId, password) {
  const response = await api.post(`/admin/users/${userId}/reset-password`, { password });
  return response.data;
}
