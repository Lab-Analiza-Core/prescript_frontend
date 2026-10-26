import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./shared/context/AuthContext";
import { PrivateRoute } from "./routes/PrivateRoute";
import { RoleRedirect, RoleRoute } from "./routes/RoleRoute";
import { DashboardLayout } from "./shared/layouts/DashboardLayout";
import { ThemeProvider } from "./shared/context/ThemeProvider";
import { ToastProvider } from "./shared/context/ToastProvider";
import { LoadingTransition } from "./shared/components/LoadingTransition";

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const AffiliatedRegistration = lazyNamed(
  () => import("./modules/auth/pages/AffiliatedRegistration"),
  "AffiliatedRegistration",
);
const ExternalRegistration = lazyNamed(
  () => import("./modules/auth/pages/ExternalRegistration"),
  "ExternalRegistration",
);
const RegisterChoice = lazyNamed(() => import("./modules/auth/pages/RegisterChoice"), "RegisterChoice");
const Login = lazyNamed(() => import("./modules/auth/pages/Login"), "Login");
const AppointmentCalendar = lazyNamed(
  () => import("./modules/appointments/pages/AppointmentCalendar"),
  "AppointmentCalendar",
);
const PatientDetail = lazyNamed(() => import("./modules/patients/pages/PatientDetail"), "PatientDetail");
const PatientList = lazyNamed(() => import("./modules/patients/pages/PatientList"), "PatientList");
const PreclinicCapture = lazyNamed(
  () => import("./modules/preclinic/pages/PreclinicCapture"),
  "PreclinicCapture",
);
const PrescriptionEditor = lazyNamed(
  () => import("./modules/prescriptions/pages/PrescriptionEditor"),
  "PrescriptionEditor",
);
const MedicineCatalog = lazyNamed(
  () => import("./modules/medicines/pages/MedicineCatalog"),
  "MedicineCatalog",
);
const ManagerDashboard = lazyNamed(
  () => import("./modules/dashboards/pages/ManagerDashboard"),
  "ManagerDashboard",
);
const UserManagement = lazyNamed(() => import("./modules/users/pages/UserManagement"), "UserManagement");
const AffiliationRequests = lazyNamed(
  () => import("./modules/affiliations/pages/AffiliationRequests"),
  "AffiliationRequests",
);
const MyOrganization = lazyNamed(
  () => import("./modules/organizations/pages/MyOrganization"),
  "MyOrganization",
);
const OrganizationsAdmin = lazyNamed(
  () => import("./modules/organizations/pages/OrganizationsAdmin"),
  "OrganizationsAdmin",
);
const AppearanceAdmin = lazyNamed(
  () => import("./modules/appearance/pages/AppearanceAdmin"),
  "AppearanceAdmin",
);
const MyHistory = lazyNamed(() => import("./modules/patientPortal/pages/MyHistory"), "MyHistory");

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
            <Suspense fallback={<LoadingTransition label="Cargando modulo" />}>
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
                  <Route path="apariencia" element={<RoleRoute routeKey="apariencia"><AppearanceAdmin /></RoleRoute>} />
                  <Route path="mi-organizacion" element={<RoleRoute routeKey="mi-organizacion"><MyOrganization /></RoleRoute>} />
                  <Route path="mi-historial" element={<RoleRoute routeKey="mi-historial"><MyHistory /></RoleRoute>} />
                </Route>
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </Suspense>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
