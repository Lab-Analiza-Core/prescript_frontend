import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { ProfileModal } from "../components/ProfileModal";
import { useAuth } from "../context/useAuth";

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>

      <div className={isSidebarOpen ? "sidebar-layer open" : "sidebar-layer"}>
        <Sidebar isGlobalAdmin={Boolean(user?.isGlobalAdmin)} onNavigate={() => setIsSidebarOpen(false)} role={user?.role || "doctor"} />
      </div>

      <button
        aria-label="Cerrar menu"
        className={isSidebarOpen ? "sidebar-backdrop visible" : "sidebar-backdrop"}
        onClick={() => setIsSidebarOpen(false)}
        type="button"
      />

      <div className="workspace">
        <Topbar onOpenProfile={() => setIsProfileOpen(true)} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="content-area" id="main-content" tabIndex={-1}>
          <div className="route-transition" key={`${location.pathname}-${location.search}-${user?.countryCode || "all"}`}>
            <Outlet />
          </div>
        </main>
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
    </div>
  );
}
