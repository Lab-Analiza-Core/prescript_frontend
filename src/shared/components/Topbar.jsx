import { LogOut, Menu, Search, UserRound } from "lucide-react";

import { useAuth } from "../context/useAuth";

export function Topbar({ onOpenProfile, onToggleSidebar }) {
  const { logout, user } = useAuth();

  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onToggleSidebar} type="button" aria-label="Abrir menu">
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="search-shell">
        <Search size={18} aria-hidden="true" />
        <input aria-label="Buscar" placeholder="Buscar paciente, cita o receta" type="search" />
      </div>

      <div className="session-chip">
        <span>Turno clinico</span>
        <span>{user?.country}</span>
        <span>{user?.zone}</span>
      </div>

      <button className="profile-trigger" onClick={onOpenProfile} type="button" aria-label="Abrir perfil de usuario">
        <UserRound size={18} aria-hidden="true" />
        <span className="user-text">
          <strong>{user?.name}</strong>
          <small>{user?.roleLabel || user?.role}</small>
        </span>
      </button>

      <button className="icon-button" onClick={logout} type="button" aria-label="Cerrar sesion">
        <LogOut size={19} aria-hidden="true" />
      </button>
    </header>
  );
}
