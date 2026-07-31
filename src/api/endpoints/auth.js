import api from "../axios";

export async function loginRequest({ email, password, username }) {
  const response = await api.post("/auth/login", {
    username: username || email,
    password,
  });
  return response.data;
}

export async function activateDoctorRequest({ identifier, email, password, passwordConfirm }) {
  const response = await api.post("/auth/doctor/activate", {
    identifier,
    email,
    password,
    password_confirm: passwordConfirm,
  });
  return response.data;
}

export async function meRequest() {
  const response = await api.get("/auth/me");
  return response.data;
}
