import { useState } from "react";
import { Building2, Edit3, FileText, Plus, Settings2, UserCheck } from "lucide-react";

import { createOrganization, listOrganizations, updateOrganization } from "../services/organizationService";
import { PageHeader } from "../../../shared/components/PageHeader";
import { Pagination } from "../../../shared/components/Pagination";
import { usePagedResource } from "../../../shared/hooks/usePagedResource";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { OrganizationFormModal } from "../components/OrganizationFormModal";
import { OrganizationWorkspace } from "../components/OrganizationWorkspace";
import { OrgAdminRequestsPanel } from "../components/OrgAdminRequestsPanel";
import { TermsPanel } from "../components/TermsPanel";
import { ORGANIZATION_STATUS_LABELS } from "../organizationConstants";

const COLUMNS = "minmax(180px,1.4fr) 0.8fr 1fr 1fr 0.7fr 100px";

const TABS = [
  { key: "organizations", label: "Organizaciones", icon: Building2 },
  { key: "requests", label: "Solicitudes de administrador", icon: UserCheck },
  { key: "terms", label: "Terminos y condiciones", icon: FileText },
];

// Solo el administrador global: crea organizaciones, aprueba administradores y publica terminos.
// Los administradores por pais llegan a esta ruta pero la API los rechaza, asi que ni se consulta.
export function OrganizationsAdmin() {
  const { user } = useAuth();

  if (!user?.isGlobalAdmin) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Administracion global" title="Organizaciones">
          Solo el administrador global puede gestionar organizaciones.
        </PageHeader>
      </div>
    );
  }

  return <OrganizationsAdminContent countries={user.availableCountries || []} />;
}

function OrganizationsAdminContent({ countries }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState("organizations");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [modal, setModal] = useState({ isOpen: false, organization: null });
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, error, isLoading, page, reload, setPage, total } = usePagedResource(
    (pageNumber) => listOrganizations({ search: appliedSearch, page: pageNumber }),
    `organizations-${appliedSearch}`,
  );
  const organizations = data || [];
  const selectedOrganization = organizations.find((organization) => organization.id === selected);

  // El panel de gestion queda debajo de la lista: se baja hasta el para que se note que se abrio.
  const selectOrganization = (id) => {
    setSelected(id);
    setTimeout(() => document.getElementById("organization-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const saveOrganization = async (payload) => {
    setIsSaving(true);
    try {
      if (modal.organization) {
        await updateOrganization(modal.organization.id, payload);
        showToast("Organizacion actualizada.", "success");
      } else {
        const created = await createOrganization(payload);
        setSelected(created.id);
        showToast("Organizacion creada. Ya puede emitir invitaciones.", "success");
      }
      setModal({ isOpen: false, organization: null });
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo guardar la organizacion."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          tab === "organizations" ? (
            <button className="primary-action compact" onClick={() => setModal({ isOpen: true, organization: null })} type="button">
              <Plus size={18} aria-hidden="true" />
              Organizacion
            </button>
          ) : null
        }
        eyebrow="Administracion global"
        title="Organizaciones"
      >
        Cada usuario pertenece a una organizacion; su administrador responde por los usuarios afiliados a ella.
      </PageHeader>

      <div className="admin-tabs" role="tablist" aria-label="Administracion de organizaciones">
        {TABS.map(({ icon: Icon, key, label }) => (
          <button
            aria-selected={tab === key}
            className={tab === key ? "admin-tab active" : "admin-tab"}
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            type="button"
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === "organizations" ? (
        <>
          <div className="user-control-panel">
            <div className="user-control-header">
              <div>
                <h2>Todas las organizaciones</h2>
                <span>{total} registros</span>
              </div>
              <div className="user-control-actions">
                <div className="toolbar user-search">
                  <input
                    aria-label="Buscar organizacion"
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && setAppliedSearch(search.trim())}
                    placeholder="Nombre de la organizacion"
                    type="search"
                    value={search}
                  />
                </div>
                <button className="secondary-action compact" onClick={() => setAppliedSearch(search.trim())} type="button">
                  Buscar
                </button>
              </div>
            </div>

            <div className="user-table">
              <div className="table-row table-head admin-row" style={{ "--cols": COLUMNS }}>
                <span>Organizacion</span>
                <span>Pais</span>
                <span>Division</span>
                <span>Area medica</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>

              {isLoading && !data ? <div className="empty-state">Cargando organizaciones</div> : null}
              {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las organizaciones.")}</div> : null}
              {data && organizations.length === 0 ? <div className="empty-state">Sin organizaciones para mostrar</div> : null}

              {organizations.map((organization) => (
                <article
                  className={organization.id === selected ? "table-row admin-row row-selected" : "table-row admin-row"}
                  key={organization.id}
                  style={{ "--cols": COLUMNS }}
                >
                  <strong>
                    {organization.name} {organization.is_interactive_core ? <span className="role-badge">Interactive Core</span> : null}
                  </strong>
                  <span>{organization.country_name}</span>
                  <span>{organization.division_name ? `${organization.division_type}: ${organization.division_name}` : "—"}</span>
                  <span title={(organization.medical_area_names || []).join(", ")}>
                    {organization.medical_area_names?.join(", ") || "—"}
                  </span>
                  <span className={organization.status === "active" ? "status-badge confirmed" : "status-badge cancelled"}>
                    {ORGANIZATION_STATUS_LABELS[organization.status] || organization.status}
                  </span>
                  <div className="row-actions">
                    <button className="icon-button" onClick={() => selectOrganization(organization.id)} type="button" aria-label="Gestionar organizacion" title="Gestionar: miembros, invitaciones y apariencia">
                      <Settings2 size={16} aria-hidden="true" />
                    </button>
                    <button className="icon-button" onClick={() => setModal({ isOpen: true, organization })} type="button" aria-label="Editar organizacion" title="Editar datos de la organizacion">
                      <Edit3 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <Pagination isLoading={isLoading} onPageChange={setPage} page={page} total={total} />
          </div>

          {selectedOrganization ? (
            <section className="user-control-panel" id="organization-workspace" aria-label={`Gestion de ${selectedOrganization.name}`}>
              <div className="user-control-header">
                <div>
                  <h2>{selectedOrganization.name}</h2>
                  <span>Administre a las personas, invitaciones, secretarias y apariencia de esta organizacion</span>
                </div>
              </div>
              <OrganizationWorkspace isGlobal key={selectedOrganization.id} organization={selectedOrganization} />
            </section>
          ) : null}
        </>
      ) : null}

      {tab === "requests" ? <OrgAdminRequestsPanel /> : null}
      {tab === "terms" ? <TermsPanel /> : null}

      {modal.isOpen ? (
        <OrganizationFormModal
          countries={countries}
          isSaving={isSaving}
          onClose={() => setModal({ isOpen: false, organization: null })}
          onSubmit={saveOrganization}
          organization={modal.organization}
        />
      ) : null}
    </div>
  );
}
