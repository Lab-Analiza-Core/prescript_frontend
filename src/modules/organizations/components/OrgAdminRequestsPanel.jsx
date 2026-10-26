import { useState } from "react";
import { Check, X } from "lucide-react";

import { decideOrgAdmin, listOrgAdminRequests } from "../services/organizationService";
import { Pagination } from "../../../shared/components/Pagination";
import { usePagedResource } from "../../../shared/hooks/usePagedResource";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { ConfirmDialog } from "../../users/components/ConfirmDialog";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const COLUMNS = "minmax(200px,1.4fr) 1.2fr 0.7fr 0.7fr 90px";
const STATUS_LABELS = { pending: "Pendiente", active: "Aprobado", inactive: "Rechazado" };

export function OrgAdminRequestsPanel() {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data, error, isLoading, page, reload, setPage, total } = usePagedResource(
    (pageNumber) => listOrgAdminRequests(statusFilter, pageNumber),
    `org-admins-${statusFilter}`,
  );
  const [decision, setDecision] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const requests = data || [];

  const confirmDecision = async () => {
    setIsSaving(true);
    try {
      await decideOrgAdmin(decision.profile.id, decision.approve);
      showToast(decision.approve ? "Administrador aprobado." : "Solicitud rechazada.", "success");
      setDecision(null);
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo registrar la decision."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel-stack">
      <div className="inline-form">
        <label>
          <span>Estado</span>
          <SearchSelect onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="pending">Pendientes</option>
            <option value="active">Aprobados</option>
            <option value="inactive">Rechazados</option>
            <option value="">Todos</option>
          </SearchSelect>
        </label>
      </div>

      <div className="user-table">
        <div className="table-row table-head admin-row" style={{ "--cols": COLUMNS }}>
          <span>Solicitante</span>
          <span>Organizacion</span>
          <span>Pais</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {isLoading && !data ? <div className="empty-state">Cargando solicitudes</div> : null}
        {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las solicitudes.")}</div> : null}
        {data && requests.length === 0 ? <div className="empty-state">Sin solicitudes</div> : null}

        {requests.map((profile) => (
          <article className="table-row admin-row" key={profile.id} style={{ "--cols": COLUMNS }}>
            <div className="user-identity">
              <div>
                <strong>{profile.full_name}</strong>
                <small>{profile.email}</small>
              </div>
            </div>
            <span>{profile.organization_name}</span>
            <span>{profile.country_code}</span>
            <span className={profile.status === "active" ? "status-badge confirmed" : profile.status === "pending" ? "status-badge pending" : "status-badge cancelled"}>
              {STATUS_LABELS[profile.status] || profile.status}
            </span>
            <div className="row-actions">
              {profile.status !== "active" ? (
                <button className="icon-button" onClick={() => setDecision({ profile, approve: true })} type="button" aria-label="Aprobar">
                  <Check size={16} aria-hidden="true" />
                </button>
              ) : null}
              {profile.status === "pending" ? (
                <button className="icon-button danger-icon-button" onClick={() => setDecision({ profile, approve: false })} type="button" aria-label="Rechazar">
                  <X size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </article>
        ))}
        <Pagination isLoading={isLoading} onPageChange={setPage} page={page} total={total} />
      </div>

      {decision ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={
            decision.approve
              ? `${decision.profile.full_name} podra administrar ${decision.profile.organization_name}. Se le avisara por correo.`
              : `Se rechazara la solicitud de ${decision.profile.full_name}. Se le avisara por correo.`
          }
          onClose={() => setDecision(null)}
          onConfirm={confirmDecision}
          title={decision.approve ? "Aprobar administrador" : "Rechazar solicitud"}
          variant={decision.approve ? "primary" : "danger"}
        />
      ) : null}
    </div>
  );
}
