import { Stethoscope } from "lucide-react";
import { NavLink } from "react-router-dom";

import { getVisibleNavigation } from "../../config/accessConfig";
import { useTheme } from "../context/useTheme";

export function Sidebar({ isGlobalAdmin = false, onNavigate, role }) {
  const items = getVisibleNavigation(role, { isGlobalAdmin });
  const { logo } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        {logo ? (
          <img className="sidebar-logo" src={logo} alt="Prescript" />
        ) : (
          <>
            <div className="brand-symbol">
              <Stethoscope size={20} aria-hidden="true" />
            </div>
            <div>
              <strong>Prescript</strong>
              <span>Bitacora clinica</span>
            </div>
          </>
        )}
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
    </aside>
  );
}
