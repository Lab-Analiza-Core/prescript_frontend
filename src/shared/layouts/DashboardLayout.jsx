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
      <div className={isSidebarOpen ? "sidebar-layer open" : "sidebar-layer"}>
        <Sidebar onNavigate={() => setIsSidebarOpen(false)} role={user?.role || "doctor"} />
      </div>

      <button
        aria-label="Cerrar menu"
        className={isSidebarOpen ? "sidebar-backdrop visible" : "sidebar-backdrop"}
        onClick={() => setIsSidebarOpen(false)}
        type="button"
      />

      <main className="workspace">
        <Topbar onOpenProfile={() => setIsProfileOpen(true)} onToggleSidebar={() => setIsSidebarOpen(true)} />
        <section className="content-area">
          <div className="route-transition" key={location.pathname}>
            <Outlet />
          </div>
        </section>
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
    </div>
  );
}
