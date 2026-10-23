import { Building2 } from "lucide-react";

import { listOrganizations } from "../../../api/endpoints/organizations";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { OrganizationWorkspace } from "../components/OrganizationWorkspace";
import { ORGANIZATION_STATUS_LABELS } from "../organizationConstants";

// Panel del administrador de organizacion: ve y gestiona unicamente la suya.
export function MyOrganization() {
  const { data, error, isLoading } = useApiResource(listOrganizations, "my-organization");
  const organization = data?.[0];

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Administracion" title="Mi organizacion">
        Controle quien tiene acceso, emita codigos de invitacion y vincule secretarias con sus doctores.
      </PageHeader>

      {isLoading && !data ? <div className="empty-state">Cargando organizacion</div> : null}
      {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudo cargar la organizacion.")}</div> : null}
      {data && !organization ? <div className="empty-state">No tiene una organizacion activa asignada.</div> : null}

      {organization ? (
        <>
          <div className="org-summary">
            <Building2 size={22} aria-hidden="true" />
            <div>
              <strong>{organization.name}</strong>
              <small>
                {[
                  organization.country_name,
                  organization.division_name && `${organization.division_type}: ${organization.division_name}`,
                  organization.medical_area_name,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </div>
            <span className={organization.status === "active" ? "status-badge confirmed" : "status-badge cancelled"}>
              {ORGANIZATION_STATUS_LABELS[organization.status] || organization.status}
            </span>
          </div>

          <section className="user-control-panel">
            <OrganizationWorkspace organization={organization} />
          </section>
        </>
      ) : null}
    </div>
  );
}
