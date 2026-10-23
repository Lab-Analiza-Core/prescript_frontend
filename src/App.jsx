import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./shared/context/AuthContext";
import { PrivateRoute } from "./routes/PrivateRoute";
import { RoleRedirect, RoleRoute } from "./routes/RoleRoute";
import { DashboardLayout } from "./shared/layouts/DashboardLayout";
import { ToastProvider } from "./shared/context/ToastProvider";
import { AffiliatedRegistration } from "./modules/auth/pages/AffiliatedRegistration";
import { ExternalRegistration } from "./modules/auth/pages/ExternalRegistration";
import { RegisterChoice } from "./modules/auth/pages/RegisterChoice";
import { Login } from "./modules/auth/pages/Login";
import { AppointmentCalendar } from "./modules/appointments/pages/AppointmentCalendar";
import { PatientDetail } from "./modules/patients/pages/PatientDetail";
import { PatientList } from "./modules/patients/pages/PatientList";
import { PreclinicCapture } from "./modules/preclinic/pages/PreclinicCapture";
import { PrescriptionEditor } from "./modules/prescriptions/pages/PrescriptionEditor";
import { MedicineCatalog } from "./modules/medicines/pages/MedicineCatalog";
import { ManagerDashboard } from "./modules/dashboards/pages/ManagerDashboard";
import { UserManagement } from "./modules/users/pages/UserManagement";
import { AffiliationRequests } from "./modules/affiliations/pages/AffiliationRequests";
import { MyOrganization } from "./modules/organizations/pages/MyOrganization";
import { OrganizationsAdmin } from "./modules/organizations/pages/OrganizationsAdmin";
import { MyHistory } from "./modules/patientPortal/pages/MyHistory";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* La activacion por identificador se cerro: los enlaces antiguos llevan al registro de afiliados. */}
          <Route path="/activar-acceso" element={<Navigate to="/registro/afiliado" replace />} />
          <Route path="/registro" element={<RegisterChoice />} />
          <Route path="/registro/afiliado" element={<AffiliatedRegistration />} />
          <Route path="/registro/externo" element={<ExternalRegistration />} />
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<RoleRedirect />} />
            <Route path="agenda" element={<RoleRoute routeKey="agenda"><AppointmentCalendar /></RoleRoute>} />
            <Route path="pacientes" element={<RoleRoute routeKey="pacientes"><PatientList /></RoleRoute>} />
            <Route path="pacientes/:patientId" element={<RoleRoute routeKey="pacientes/:patientId"><PatientDetail /></RoleRoute>} />
            <Route path="preclinica" element={<RoleRoute routeKey="preclinica"><PreclinicCapture /></RoleRoute>} />
            <Route path="recetas" element={<RoleRoute routeKey="recetas"><PrescriptionEditor /></RoleRoute>} />
            <Route path="medicamentos" element={<RoleRoute routeKey="medicamentos"><MedicineCatalog /></RoleRoute>} />
            <Route path="dashboard" element={<RoleRoute routeKey="dashboard"><ManagerDashboard /></RoleRoute>} />
            <Route path="usuarios" element={<RoleRoute routeKey="usuarios"><UserManagement /></RoleRoute>} />
            <Route path="afiliaciones" element={<RoleRoute routeKey="afiliaciones"><AffiliationRequests /></RoleRoute>} />
            <Route path="organizaciones" element={<RoleRoute routeKey="organizaciones"><OrganizationsAdmin /></RoleRoute>} />
            <Route path="mi-organizacion" element={<RoleRoute routeKey="mi-organizacion"><MyOrganization /></RoleRoute>} />
            <Route path="mi-historial" element={<RoleRoute routeKey="mi-historial"><MyHistory /></RoleRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
