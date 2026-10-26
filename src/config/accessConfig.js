import {
  Activity,
  BadgeCheck,
  BarChart3,
  Building,
  Building2,
  CalendarDays,
  ClipboardList,
  FilePenLine,
  Palette,
  Pill,
  UserCog,
  UsersRound,
} from "lucide-react";

export const ROLE_ALIASES = {
  ADMIN: "admin",
  COUNTRY_MANAGER: "manager",
  DOCTOR: "doctor",
  NURSE: "nurse",
  ORG_ADMIN: "org_admin",
  PATIENT: "patient",
  SECRETARY: "secretary",
};

export const normalizeRole = (role) => {
  const value = String(role || "").trim();
  if (!value) return "";
  if (value.toUpperCase().startsWith("ADMIN_")) return "admin";
  return ROLE_ALIASES[value.toUpperCase()] || value.toLowerCase();
};

// globalOnly: solo el administrador global (los administradores por pais no gestionan organizaciones).
export const navigationItems = [
  { label: "Agenda", path: "/app/agenda", icon: CalendarDays, roles: ["doctor", "secretary"] },
  { label: "Pacientes", path: "/app/pacientes", icon: UsersRound, roles: ["doctor", "secretary", "nurse", "admin", "manager"] },
  { label: "Preclinica", path: "/app/preclinica", icon: Activity, roles: ["doctor", "nurse"] },
  { label: "Recetas", path: "/app/recetas", icon: FilePenLine, roles: ["doctor"] },
  { label: "Medicamentos", path: "/app/medicamentos", icon: Pill, roles: ["doctor"] },
  { label: "KPIs", path: "/app/dashboard", icon: BarChart3, roles: ["manager", "admin"] },
  { label: "Usuarios", path: "/app/usuarios", icon: UserCog, roles: ["admin"] },
  { label: "Afiliaciones", path: "/app/afiliaciones", icon: BadgeCheck, roles: ["admin"] },
  { label: "Organizaciones", path: "/app/organizaciones", icon: Building2, roles: ["admin"], globalOnly: true },
  { label: "Apariencia", path: "/app/apariencia", icon: Palette, roles: ["admin"] },
  { label: "Mi organizacion", path: "/app/mi-organizacion", icon: Building, roles: ["org_admin"] },
  { label: "Mi historial", path: "/app/mi-historial", icon: ClipboardList, roles: ["patient"] },
];

export const routeAccess = {
  agenda: ["doctor", "secretary"],
  pacientes: ["doctor", "secretary", "nurse", "admin", "manager"],
  "pacientes/:patientId": ["doctor", "secretary", "nurse", "admin", "manager"],
  preclinica: ["doctor", "nurse"],
  recetas: ["doctor"],
  medicamentos: ["doctor"],
  dashboard: ["manager", "admin"],
  usuarios: ["admin"],
  afiliaciones: ["admin"],
  organizaciones: ["admin"],
  apariencia: ["admin"],
  "mi-organizacion": ["org_admin"],
  "mi-historial": ["patient"],
};

export const firstRouteByRole = {
  admin: "/app/usuarios",
  doctor: "/app/agenda",
  manager: "/app/dashboard",
  nurse: "/app/preclinica",
  org_admin: "/app/mi-organizacion",
  patient: "/app/mi-historial",
  secretary: "/app/agenda",
};

const GLOBAL_ONLY_ROUTES = new Set(["organizaciones"]);

export const canAccessRoute = (role, routeKey, { isGlobalAdmin = false } = {}) => {
  const allowedRoles = routeAccess[routeKey] || [];
  if (!allowedRoles.includes(normalizeRole(role))) return false;
  return !GLOBAL_ONLY_ROUTES.has(routeKey) || isGlobalAdmin;
};

export const getVisibleNavigation = (role, { isGlobalAdmin = false } = {}) => {
  const normalizedRole = normalizeRole(role);
  return navigationItems.filter(
    (item) => item.roles.includes(normalizedRole) && (!item.globalOnly || isGlobalAdmin),
  );
};
