import { HeartPulse, Stethoscope } from "lucide-react";
import { NavLink } from "react-router-dom";

import { navigationItems, normalizeRole } from "../../config/accessConfig";

export function Sidebar({ onNavigate, role }) {
  const normalizedRole = normalizeRole(role);
  const items = navigationItems.filter((item) => item.roles.includes(normalizedRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-symbol">
          <Stethoscope size={20} aria-hidden="true" />
        </div>
        <div>
          <strong>Prescript</strong>
          <span>Consulta</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Modulos de Prescript">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.path} className="side-link" onClick={onNavigate} to={item.path}>
              <span className="side-icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <HeartPulse size={18} aria-hidden="true" />
        <span>MVP clinico</span>
      </div>
    </aside>
  );
}
