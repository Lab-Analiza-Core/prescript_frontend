import {
  Activity,
  BarChart3,
  CalendarDays,
  FilePenLine,
  Pill,
  UsersRound,
} from "lucide-react";

export const ROLE_ALIASES = {
  ADMIN: "admin",
  COUNTRY_MANAGER: "manager",
  DOCTOR: "doctor",
  NURSE: "nurse",
  PATIENT: "patient",
  SECRETARY: "secretary",
};

export const normalizeRole = (role) => {
  const value = String(role || "doctor").trim();
  return ROLE_ALIASES[value.toUpperCase()] || value.toLowerCase();
};

export const navigationItems = [
  { label: "Agenda", path: "/app/agenda", icon: CalendarDays, roles: ["doctor", "secretary"] },
  { label: "Pacientes", path: "/app/pacientes", icon: UsersRound, roles: ["doctor", "secretary", "nurse", "admin", "manager"] },
  { label: "Preclinica", path: "/app/preclinica", icon: Activity, roles: ["doctor", "nurse"] },
  { label: "Recetas", path: "/app/recetas", icon: FilePenLine, roles: ["doctor"] },
  { label: "Medicamentos", path: "/app/medicamentos", icon: Pill, roles: ["doctor"] },
  { label: "KPIs", path: "/app/dashboard", icon: BarChart3, roles: ["manager", "admin"] },
];

export const routeAccess = {
  agenda: ["doctor", "secretary"],
  pacientes: ["doctor", "secretary", "nurse", "admin", "manager"],
  "pacientes/:patientId": ["doctor", "secretary", "nurse", "admin", "manager"],
  preclinica: ["doctor", "nurse"],
  recetas: ["doctor"],
  medicamentos: ["doctor"],
  dashboard: ["manager", "admin"],
};

export const firstRouteByRole = {
  admin: "/app/dashboard",
  doctor: "/app/agenda",
  manager: "/app/dashboard",
  nurse: "/app/preclinica",
  patient: "/app/pacientes",
  secretary: "/app/agenda",
};

export const canAccessRoute = (role, routeKey) => {
  const allowedRoles = routeAccess[routeKey] || [];
  return allowedRoles.includes(normalizeRole(role));
};
