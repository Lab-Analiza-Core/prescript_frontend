import api from "../../../api/axios";

export async function listAffiliationRequests(status, page) {
  const response = await api.get("/admin/affiliation-requests", {
    params: { ...(status ? { status } : {}), ...(page ? { page } : {}) },
  });
  return response.data;
}

export async function decideAffiliationRequest(requestId, approve) {
  const response = await api.post(`/admin/affiliation-requests/${requestId}/${approve ? "approve" : "reject"}`);
  return response.data;
}
