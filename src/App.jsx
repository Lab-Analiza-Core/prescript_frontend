import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./shared/context/AuthContext";
import { PrivateRoute } from "./routes/PrivateRoute";
import { RoleRedirect, RoleRoute } from "./routes/RoleRoute";
import { DashboardLayout } from "./shared/layouts/DashboardLayout";
import { ToastProvider } from "./shared/context/ToastProvider";
import { DoctorActivation } from "./modules/auth/pages/DoctorActivation";
import { Login } from "./modules/auth/pages/Login";
import { AppointmentCalendar } from "./modules/appointments/pages/AppointmentCalendar";
import { PatientDetail } from "./modules/patients/pages/PatientDetail";
import { PatientList } from "./modules/patients/pages/PatientList";
import { PreclinicCapture } from "./modules/preclinic/pages/PreclinicCapture";
import { PrescriptionEditor } from "./modules/prescriptions/pages/PrescriptionEditor";
import { MedicineCatalog } from "./modules/medicines/pages/MedicineCatalog";
import { ManagerDashboard } from "./modules/dashboards/pages/ManagerDashboard";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/activar-acceso" element={<DoctorActivation />} />
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
          </Route>
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
