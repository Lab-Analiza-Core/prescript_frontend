import { Building2, Globe2, LogOut, Menu, Stethoscope, UserRound } from "lucide-react";

import { useAuth } from "../context/useAuth";
import { ExternalBadge } from "./ExternalBadge";
import { GlobalSearch } from "./GlobalSearch";

function getContextLabel(item) {
  if (typeof item === "string") return item.trim();
  return item?.name || item?.description || item?.label || "";
}

function summarizeContext(items, emptyLabel) {
  const labels = Array.from(new Set((Array.isArray(items) ? items : []).map(getContextLabel).filter(Boolean)));
  if (!labels.length) return { isEmpty: true, label: emptyLabel, title: emptyLabel };
  return {
    isEmpty: false,
    label: labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`,
    title: labels.join(", "),
  };
}

const ROLE_DISPLAY = { ORG_ADMIN: "Admin. de organizacion", PATIENT: "Paciente" };

// Pacientes y administradores de organizacion no tienen datos clinicos que buscar.
const HAS_CLINICAL_SEARCH = new Set(["doctor", "secretary", "nurse", "admin", "manager"]);

export function Topbar({ onOpenProfile, onToggleSidebar }) {
  const { logout, selectCountry, user } = useAuth();
  const specialty = summarizeContext(user?.doctorProfile?.specialties, "Sin especialidad");
  const clinic = summarizeContext(user?.doctorProfile?.clinics, "Sin clínica asignada");

  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onToggleSidebar} type="button" aria-label="Abrir menu">
        <Menu size={20} aria-hidden="true" />
      </button>

      {HAS_CLINICAL_SEARCH.has(user?.role) ? (
        <GlobalSearch country={user?.country} countryCode={user?.countryCode} />
      ) : (
        <div className="topbar-spacer" />
      )}

      <div className="session-chip">
        {user?.doctorProfile ? (
          <span className={specialty.isEmpty ? "context-chip specialty-chip is-empty" : "context-chip specialty-chip"} title={specialty.title}>
            <span className="context-chip-icon"><Stethoscope size={15} aria-hidden="true" /></span>
            <span className="context-chip-copy"><small>Especialidad</small><strong>{specialty.label}</strong></span>
          </span>
        ) : null}
        {user?.isGlobalAdmin ? (
          <label className="context-chip country-selector">
            <span className="sr-only">Pais activo</span>
            <span className="context-chip-icon"><Globe2 size={15} aria-hidden="true" /></span>
            <span className="context-chip-copy">
              <small>País activo</small>
              <select
                aria-label="Pais activo"
                onChange={(event) => selectCountry(event.target.value)}
                value={user?.countryCode || ""}
              >
                <option value="">Todos los países</option>
                {user.availableCountries.map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </span>
          </label>
        ) : null}
        {user?.doctorProfile ? (
          <span className={clinic.isEmpty ? "context-chip clinic-chip is-empty" : "context-chip clinic-chip"} title={clinic.title}>
            <span className="context-chip-icon"><Building2 size={15} aria-hidden="true" /></span>
            <span className="context-chip-copy"><small>Centro asistencial</small><strong>{clinic.label}</strong></span>
          </span>
        ) : null}
      </div>

      <button
        aria-label="Abrir perfil de usuario"
        className="profile-trigger user-chip"
        onClick={onOpenProfile}
        title={user?.displayName || user?.name}
        type="button"
      >
        <span className="context-chip-icon"><UserRound size={15} aria-hidden="true" /></span>
        <span className="context-chip-copy">
          <span className="user-chip-meta">
            <small>{ROLE_DISPLAY[user?.roleLabel] || user?.roleLabel || user?.role}</small>
            {user?.isExternal ? <ExternalBadge /> : null}
          </span>
          <strong>{user?.displayName || user?.name}</strong>
        </span>
      </button>

      <button className="icon-button" onClick={logout} type="button" aria-label="Cerrar sesion">
        <LogOut size={19} aria-hidden="true" />
      </button>
    </header>
  );
}
