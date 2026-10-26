import api from "../../../api/axios";

export async function loginRequest({ email, password, username }) {
  const response = await api.post("/auth/login", {
    username: username || email,
    password,
  });
  return response.data;
}

export async function meRequest() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function updateMeRequest(payload) {
  const response = await api.patch("/auth/me", payload);
  return response.data;
}
