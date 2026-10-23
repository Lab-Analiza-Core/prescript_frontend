import api from "../axios";

// --- Organizaciones (administrador global; el de organizacion solo lee la suya) ---------

export async function listOrganizations(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.country) params.country = filters.country;
  if (filters.status) params.status = filters.status;
  const response = await api.get("/admin/organizations", { params });
  return response.data;
}

export async function createOrganization(payload) {
  const response = await api.post("/admin/organizations", payload);
  return response.data;
}

export async function updateOrganization(organizationId, payload) {
  const response = await api.patch(`/admin/organizations/${organizationId}`, payload);
  return response.data;
}

// --- Invitaciones -------------------------------------------------------------------

export async function listInvitations(organizationId) {
  const response = await api.get(`/admin/organizations/${organizationId}/invitations`);
  return response.data;
}

export async function createInvitation(organizationId, payload) {
  const response = await api.post(`/admin/organizations/${organizationId}/invitations`, payload);
  return response.data;
}

export async function revokeInvitation(invitationId) {
  await api.delete(`/admin/invitations/${invitationId}`);
}

// --- Miembros -----------------------------------------------------------------------

export async function listMembers(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.role) params.role = filters.role;
  if (filters.organization) params.organization = filters.organization;
  const response = await api.get("/admin/members", { params });
  return response.data;
}

export async function setMemberActive(userId, isActive) {
  const response = await api.patch(`/admin/members/${userId}`, { is_active: isActive });
  return response.data;
}

// --- Vinculos secretaria-doctor ---------------------------------------------------------

export async function listSecretaryAssignments() {
  const response = await api.get("/admin/secretary-assignments");
  return response.data;
}

export async function createSecretaryAssignment({ secretary, doctor }) {
  const response = await api.post("/admin/secretary-assignments", { secretary, doctor });
  return response.data;
}

export async function deleteSecretaryAssignment(assignmentId) {
  await api.delete(`/admin/secretary-assignments/${assignmentId}`);
}

// --- Aprobacion de administradores de organizacion --------------------------------------

export async function listOrgAdminRequests(status) {
  const response = await api.get("/admin/org-admins", { params: status ? { status } : {} });
  return response.data;
}

export async function decideOrgAdmin(profileId, approve) {
  const response = await api.post(`/admin/org-admins/${profileId}/${approve ? "approve" : "reject"}`);
  return response.data;
}

// --- Terminos y condiciones ---------------------------------------------------------------

export async function listTermsVersions() {
  const response = await api.get("/admin/terms");
  return response.data;
}

export async function publishTerms(payload) {
  const response = await api.post("/admin/terms", payload);
  return response.data;
}
