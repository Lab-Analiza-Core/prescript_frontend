import api from "../axios";

// --- Catalogos publicos del registro -------------------------------------------------

export async function getInvitationInfo(invitationCode) {
  const response = await api.post("/auth/invitation/validate", { invitation_code: invitationCode });
  return response.data;
}

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

// --- Registro por invitacion (no afiliados) -------------------------------------------

export async function registerExternalRequest(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data;
}

// --- Afiliacion a Interactive Core (doctor, secretaria o enfermera) ----------------------

export async function searchAffiliation(role, query, { signal } = {}) {
  const response = await api.get("/auth/affiliation/search", { params: { role, q: query }, signal });
  return response.data;
}

// `email` solo aplica cuando la ficha de Interactive Core no tiene correo (revision manual).
export async function requestAffiliationCode(role, profileId, email) {
  const response = await api.post("/auth/affiliation/request-code", {
    role,
    profile_id: profileId,
    ...(email ? { email } : {}),
  });
  return response.data;
}

export async function activateAffiliationRequest({ role, profileId, code, password, passwordConfirm, acceptTerms, email, phone }) {
  const response = await api.post("/auth/affiliation/activate", {
    role,
    profile_id: profileId,
    code,
    password,
    password_confirm: passwordConfirm,
    accept_terms: acceptTerms,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  });
  return response.data;
}

// --- Paciente: vinculacion y consulta de historial --------------------------------------

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

// --- Revision de solicitudes de afiliacion (administradores de Interactive Core) -----------

export async function listAffiliationRequests(status) {
  const response = await api.get("/admin/affiliation-requests", { params: status ? { status } : {} });
  return response.data;
}

export async function decideAffiliationRequest(requestId, approve) {
  const response = await api.post(`/admin/affiliation-requests/${requestId}/${approve ? "approve" : "reject"}`);
  return response.data;
}
