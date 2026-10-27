import api from "../../../api/axios";

export async function listOrganizations(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.country) params.country = filters.country;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;
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

export async function listInvitations(organizationId, page) {
  const response = await api.get(`/admin/organizations/${organizationId}/invitations`, { params: page ? { page } : {} });
  return response.data;
}

export async function createInvitation(organizationId, payload) {
  const response = await api.post(`/admin/organizations/${organizationId}/invitations`, payload);
  return response.data;
}

export async function revokeInvitation(invitationId) {
  await api.delete(`/admin/invitations/${invitationId}`);
}

export async function listMembers(filters = {}) {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.role) params.role = filters.role;
  if (filters.organization) params.organization = filters.organization;
  if (filters.page) params.page = filters.page;
  const response = await api.get("/admin/members", { params });
  return response.data;
}

export async function setMemberActive(userId, isActive) {
  const response = await api.patch(`/admin/members/${userId}`, { is_active: isActive });
  return response.data;
}

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

export async function listOrgAdminRequests(status, page) {
  const response = await api.get("/admin/org-admins", {
    params: { ...(status ? { status } : {}), ...(page ? { page } : {}) },
  });
  return response.data;
}

export async function decideOrgAdmin(profileId, approve) {
  const response = await api.post(`/admin/org-admins/${profileId}/${approve ? "approve" : "reject"}`);
  return response.data;
}

export async function listTermsVersions() {
  const response = await api.get("/admin/terms");
  return response.data;
}

export async function publishTerms(payload) {
  const response = await api.post("/admin/terms", payload);
  return response.data;
}

export async function activateTerms(termsId) {
  const response = await api.post(`/admin/terms/${termsId}/activate`);
  return response.data;
}
