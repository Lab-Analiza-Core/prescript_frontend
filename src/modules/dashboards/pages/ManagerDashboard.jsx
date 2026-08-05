import { TrendingUp } from "lucide-react";

import { PageHeader } from "../../../shared/components/PageHeader";

export function ManagerDashboard() {
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Dashboard" title="KPIs privados">
        Lectura ejecutiva de actividad, asistencia y recurrencia.
      </PageHeader>

      <div className="metric-grid">
        <div className="metric-card">
          <span>Presentismo</span>
          <strong>88%</strong>
          <small>Control de agenda</small>
        </div>
        <div className="metric-card">
          <span>Recetas emitidas</span>
          <strong>126</strong>
          <small>Firma medica</small>
        </div>
        <div className="metric-card">
          <span>Pacientes activos</span>
          <strong>342</strong>
          <small>Seguimiento vivo</small>
        </div>
      </div>

      <section className="detail-panel">
        <h2>
          <TrendingUp size={19} aria-hidden="true" />
          Evolucion
        </h2>
        <div className="chart-placeholder" />
      </section>
    </div>
  );
}
