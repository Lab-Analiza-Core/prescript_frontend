import api from "../../../api/axios";

export async function getInvitationInfo(invitationCode) {
  const response = await api.post("/auth/invitation/validate", { invitation_code: invitationCode });
  return response.data;
}

export async function registerExternalRequest(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data;
}

export async function searchAffiliation(role, query, { signal } = {}) {
  const response = await api.get("/auth/affiliation/search", { params: { role, q: query }, signal });
  return response.data;
}

// `email` solo aplica cuando la ficha de Interactive Core no tiene correo.
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
