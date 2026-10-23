import { useState } from "react";
import { Check, X } from "lucide-react";

import { decideAffiliationRequest, listAffiliationRequests } from "../../../api/endpoints/onboarding";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { ConfirmDialog } from "../../users/components/ConfirmDialog";

const COLUMNS = "minmax(190px,1.3fr) 0.5fr minmax(230px,1.5fr) 0.8fr 0.7fr 90px";
const ROLE_LABELS = { DOCTOR: "Doctor", SECRETARY: "Secretaria", NURSE: "Enfermera" };
const STATUS_LABELS = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };
const STATUS_CLASSES = {
  pending: "status-badge pending",
  approved: "status-badge confirmed",
  rejected: "status-badge cancelled",
};

// Personal cuya ficha de Interactive Core no tiene correo: el administrador confirma que son quienes dicen ser.
export function AffiliationRequests() {
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data, error, isLoading, reload } = useApiResource(
    () => listAffiliationRequests(statusFilter),
    `affiliation-requests-${statusFilter}`,
  );
  const [decision, setDecision] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const requests = data || [];

  const confirmDecision = async () => {
    setIsSaving(true);
    try {
      await decideAffiliationRequest(decision.request.id, decision.approve);
      showToast(decision.approve ? "Afiliacion aprobada." : "Solicitud rechazada.", "success");
      setDecision(null);
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo registrar la decision."), "error");
      setDecision(null);
      reload();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Administracion" title="Solicitudes de afiliacion">
        Personal sin correo en su ficha de Interactive Core. Verificaron que controlan su correo, pero usted debe
        confirmar que son quienes dicen ser (por ejemplo, llamando al telefono de contacto).
      </PageHeader>

      <div className="user-control-panel">
        <div className="user-control-header">
          <div>
            <h2>Solicitudes</h2>
            <span>{requests.length} registros</span>
          </div>
          <div className="user-control-actions">
            <select aria-label="Filtrar por estado" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="">Todas</option>
            </select>
          </div>
        </div>

        <div className="user-table">
          <div className="table-row table-head admin-row" style={{ "--cols": COLUMNS }}>
            <span>Ficha de Interactive Core</span>
            <span>Pais</span>
            <span>Solicitante</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {isLoading && !data ? <div className="empty-state">Cargando solicitudes</div> : null}
          {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las solicitudes.")}</div> : null}
          {data && requests.length === 0 ? <div className="empty-state">Sin solicitudes</div> : null}

          {requests.map((request) => (
            <article className="table-row admin-row" key={request.id} style={{ "--cols": COLUMNS }}>
              <div className="user-identity">
                <div>
                  <strong>
                    {request.full_name} <span className="role-badge">{ROLE_LABELS[request.role] || request.role}</span>
                  </strong>
                  <small>
                    {request.identifier ? `${request.identifier_label} ${request.identifier}` : `Sin ${request.identifier_label.toLowerCase()}`} ·
                    ID {request.interactive_core_id}
                  </small>
                </div>
              </div>
              <span>{request.country_code || "—"}</span>
              <div className="user-identity">
                <div>
                  <strong>{request.email}</strong>
                  <small>{request.contact_phone || "Sin telefono de contacto"}</small>
                </div>
              </div>
              <span>{new Date(request.created_at).toLocaleDateString()}</span>
              <span className={STATUS_CLASSES[request.status]}>{STATUS_LABELS[request.status] || request.status}</span>
              <div className="row-actions">
                {request.status === "pending" ? (
                  <>
                    <button className="icon-button" onClick={() => setDecision({ request, approve: true })} type="button" aria-label="Aprobar">
                      <Check size={16} aria-hidden="true" />
                    </button>
                    <button className="icon-button danger-icon-button" onClick={() => setDecision({ request, approve: false })} type="button" aria-label="Rechazar">
                      <X size={16} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      {decision ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={
            decision.approve
              ? `${decision.request.email} quedara vinculado a la ficha de ${decision.request.full_name} y podra iniciar sesion. Las otras solicitudes para esta ficha se rechazaran.`
              : `Se rechazara la solicitud de ${decision.request.email}. Se le avisara por correo.`
          }
          onClose={() => setDecision(null)}
          onConfirm={confirmDecision}
          title={decision.approve ? "Aprobar afiliacion" : "Rechazar solicitud"}
          variant={decision.approve ? "primary" : "danger"}
        />
      ) : null}
    </div>
  );
}
