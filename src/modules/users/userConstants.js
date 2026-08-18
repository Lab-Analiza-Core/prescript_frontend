export const ROLE_OPTIONS = [
  { label: "Administrador", value: "ADMIN" },
  { label: "Gerencia", value: "COUNTRY_MANAGER" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Enfermeria", value: "NURSE" },
  { label: "Secretaria", value: "SECRETARY" },
];

export const roleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || role || "Sin rol";
