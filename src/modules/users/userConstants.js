export const ROLE_OPTIONS = [
  { label: "Administrador", value: "ADMIN" },
  { label: "Gerencia", value: "COUNTRY_MANAGER" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Enfermeria", value: "NURSE" },
  { label: "Secretaria", value: "SECRETARY" },
];

// Roles que existen en la tabla pero no se asignan desde el formulario de usuarios.
const EXTRA_ROLE_LABELS = { ORG_ADMIN: "Admin. de organizacion", PATIENT: "Paciente" };

export const roleLabel = (role) =>
  ROLE_OPTIONS.find((option) => option.value === role)?.label || EXTRA_ROLE_LABELS[role] || role || "Sin rol";
