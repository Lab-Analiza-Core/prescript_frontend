import { useState } from "react";
import { Power, Search } from "lucide-react";

import { listMembers, setMemberActive } from "../../../api/endpoints/organizations";
import { ExternalBadge } from "../../../shared/components/ExternalBadge";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { ConfirmDialog } from "../../users/components/ConfirmDialog";
import { MEMBER_ROLE_FILTERS, ROLE_LABELS } from "../organizationConstants";

const COLUMNS = "minmax(200px,1.6fr) 1fr 0.7fr 80px";

export function MembersPanel({ canManageAdmins = false, organizationId }) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [role, setRole] = useState("");
  const [target, setTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, error, isLoading, reload } = useApiResource(
    () => listMembers({ organization: organizationId, search: appliedSearch, role }),
    `members-${organizationId}-${appliedSearch}-${role}`,
  );
  const members = data || [];

  const confirmToggle = async () => {
    setIsSaving(true);
    try {
      await setMemberActive(target.id, !target.is_active);
      showToast(target.is_active ? "Acceso desactivado." : "Acceso reactivado.", "success");
      setTarget(null);
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo cambiar el estado."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  // El administrador de organizacion no puede tocar su propia cuenta ni otros administradores.
  const canToggle = (member) =>
    member.id !== currentUser?.id && (canManageAdmins || member.role !== "ORG_ADMIN");

  return (
    <div className="panel-stack">
      <div className="inline-form">
        <div className="toolbar user-search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Buscar miembro"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && setAppliedSearch(search.trim())}
            placeholder="Nombre o correo"
            type="search"
            value={search}
          />
        </div>
        <select aria-label="Filtrar por rol" onChange={(event) => setRole(event.target.value)} value={role}>
          <option value="">Todos los roles</option>
          {MEMBER_ROLE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="secondary-action compact" onClick={() => setAppliedSearch(search.trim())} type="button">
          Buscar
        </button>
      </div>

      <div className="user-table">
        <div className="table-row table-head admin-row" style={{ "--cols": COLUMNS }}>
          <span>Miembro</span>
          <span>Rol</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {isLoading && !data ? <div className="empty-state">Cargando miembros</div> : null}
        {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar los miembros.")}</div> : null}
        {data && members.length === 0 ? <div className="empty-state">Sin miembros para mostrar</div> : null}

        {members.map((member) => (
          <article className="table-row admin-row" key={member.id} style={{ "--cols": COLUMNS }}>
            <div className="user-identity">
              <div>
                <strong>
                  {member.full_name} {member.is_external ? <ExternalBadge /> : null}
                </strong>
                <small>{member.email}</small>
              </div>
            </div>
            <span className="role-badge">{ROLE_LABELS[member.role] || member.role}</span>
            <span className={member.is_active ? "status-badge confirmed" : "status-badge cancelled"}>
              {member.profile_status === "pending" ? "Pendiente" : member.is_active ? "Activo" : "Inactivo"}
            </span>
            <div className="row-actions">
              {canToggle(member) ? (
                <button
                  aria-label={member.is_active ? "Desactivar acceso" : "Reactivar acceso"}
                  className={member.is_active ? "icon-button danger-icon-button" : "icon-button"}
                  onClick={() => setTarget(member)}
                  type="button"
                >
                  <Power size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {target ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={
            target.is_active
              ? `${target.full_name} no podra iniciar sesion hasta que reactive su acceso.`
              : `${target.full_name} podra volver a iniciar sesion.`
          }
          onClose={() => setTarget(null)}
          onConfirm={confirmToggle}
          title={target.is_active ? "Desactivar acceso" : "Reactivar acceso"}
          variant={target.is_active ? "danger" : "primary"}
        />
      ) : null}
    </div>
  );
}
