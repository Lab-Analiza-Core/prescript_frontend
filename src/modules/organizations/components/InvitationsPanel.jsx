import { useState } from "react";
import { Copy, Plus, Ban } from "lucide-react";

import { createInvitation, listInvitations, revokeInvitation } from "../services/organizationService";
import { Pagination } from "../../../shared/components/Pagination";
import { usePagedResource } from "../../../shared/hooks/usePagedResource";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { ConfirmDialog } from "../../users/components/ConfirmDialog";
import { getInvitationState, ROLE_LABELS } from "../organizationConstants";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const emptyForm = { role: "", maxUses: "", expiresAt: "" };

export function InvitationsPanel({ allowedRoles, organization }) {
  const { showToast } = useToast();
  const { data, error, isLoading, page, reload, setPage, total } = usePagedResource(
    (pageNumber) => listInvitations(organization.id, pageNumber),
    `invitations-${organization.id}`,
  );
  const [form, setForm] = useState({ ...emptyForm, role: allowedRoles[0].value });
  const [isSaving, setIsSaving] = useState(false);
  const [toRevoke, setToRevoke] = useState(null);
  const isSuspended = organization.status !== "active";

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const payload = { role: form.role };
    if (form.maxUses) payload.max_uses = Number(form.maxUses);
    // La fecha elegida vence al terminar ese dia (hora local).
    if (form.expiresAt) payload.expires_at = new Date(`${form.expiresAt}T23:59:59`).toISOString();

    setIsSaving(true);
    try {
      const created = await createInvitation(organization.id, payload);
      showToast(`Invitacion creada: ${created.code}`, "success");
      setForm({ ...emptyForm, role: form.role });
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo crear la invitacion."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Codigo copiado.", "success");
    } catch {
      showToast(`Copie el codigo manualmente: ${code}`, "warning");
    }
  };

  const confirmRevoke = async () => {
    setIsSaving(true);
    try {
      await revokeInvitation(toRevoke.id);
      showToast("Codigo desactivado.", "success");
      setToRevoke(null);
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo revocar la invitacion."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const invitations = data || [];

  return (
    <div className="panel-stack">
      <form className="inline-form invitation-form" onSubmit={handleCreate}>
        <label>
          <span>Para registrarse como</span>
          <SearchSelect name="role" onChange={updateField} value={form.role}>
            {allowedRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </SearchSelect>
        </label>
        <label>
          <span>Personas que pueden usarlo</span>
          <input min="1" name="maxUses" onChange={updateField} placeholder="Sin limite" type="number" value={form.maxUses} />
        </label>
        <label>
          <span>Vence el (opcional)</span>
          <input name="expiresAt" onChange={updateField} type="date" value={form.expiresAt} />
        </label>
        <button className="primary-action compact" disabled={isSaving || isSuspended} type="submit">
          <Plus size={17} aria-hidden="true" />
          Crear codigo
        </button>
      </form>
      {isSuspended ? <p className="form-error">La organizacion esta suspendida: no puede emitir invitaciones.</p> : null}

      <div className="user-table">
        <div className="table-row table-head admin-row" style={{ "--cols": "minmax(140px,1.2fr) 1fr 0.7fr 1fr 0.7fr 90px" }}>
          <span>Codigo</span>
          <span>Rol</span>
          <span>Usado</span>
          <span>Vence</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {isLoading && !data ? <div className="empty-state">Cargando invitaciones</div> : null}
        {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las invitaciones.")}</div> : null}
        {data && invitations.length === 0 ? <div className="empty-state">Aun no hay codigos. Cree el primero con "Crear codigo".</div> : null}

        {invitations.map((invitation) => {
          const state = getInvitationState(invitation);
          return (
            <article className="table-row admin-row" key={invitation.id} style={{ "--cols": "minmax(140px,1.2fr) 1fr 0.7fr 1fr 0.7fr 90px" }}>
              <code className="invitation-code">{invitation.code}</code>
              <span>{ROLE_LABELS[invitation.role] || invitation.role}</span>
              <span>
                {invitation.uses}/{invitation.max_uses ?? "∞"}
              </span>
              <span>{invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : "Sin vencimiento"}</span>
              <span className={state.key === "active" ? "status-badge confirmed" : "status-badge cancelled"}>{state.label}</span>
              <div className="row-actions">
                <button className="icon-button" onClick={() => copyCode(invitation.code)} type="button" aria-label="Copiar codigo" title="Copiar codigo">
                  <Copy size={16} aria-hidden="true" />
                </button>
                {state.key === "active" ? (
                  <button className="icon-button danger-icon-button" onClick={() => setToRevoke(invitation)} type="button" aria-label="Desactivar codigo" title="Desactivar codigo">
                    <Ban size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        <Pagination isLoading={isLoading} onPageChange={setPage} page={page} total={total} />
      </div>

      {toRevoke ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={`El codigo ${toRevoke.code} dejara de funcionar. Las cuentas ya creadas con el no se afectan.`}
          onClose={() => setToRevoke(null)}
          onConfirm={confirmRevoke}
          title="Desactivar codigo"
        />
      ) : null}
    </div>
  );
}
