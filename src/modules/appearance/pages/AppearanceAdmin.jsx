import { useState } from "react";

import { listThemeOrganizations } from "../../../shared/services/themeService";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useAuth } from "../../../shared/context/useAuth";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { SearchSelect } from "../../../shared/components/SearchSelect";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { ThemeEditor } from "../components/ThemeEditor";

const GLOBAL_SCOPE = "global";

// Administrador global (tema global y cualquier organizacion) y de pais (organizaciones de su pais).
export function AppearanceAdmin() {
  const { user } = useAuth();
  const isGlobalAdmin = Boolean(user?.isGlobalAdmin);
  const { data, error, reload } = useApiResource(() => listThemeOrganizations(), "theme-organizations");
  const [scope, setScope] = useState("");

  const organizations = data || [];
  const selectedScope = scope || (isGlobalAdmin ? GLOBAL_SCOPE : String(organizations[0]?.id ?? ""));
  const selectedOrganization = organizations.find((organization) => String(organization.id) === selectedScope) || null;

  // La API ya entrega las organizaciones ordenadas por pais y nombre.
  const options = [
    ...(isGlobalAdmin ? [{ value: GLOBAL_SCOPE, label: "Tema global (todas las organizaciones)", isPinned: true }] : []),
    ...organizations.map((organization) => ({
      value: String(organization.id),
      label: organization.name,
      group: organization.country.name,
      hint: organization.customized ? "Personalizada" : "Hereda",
      isHintStrong: organization.customized,
    })),
  ];

  const isEditingGlobal = isGlobalAdmin && selectedScope === GLOBAL_SCOPE;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Administracion" title="Apariencia">
        Colores, fuente y logo de Prescript. Cada organizacion hereda el tema global hasta que se personalice.
      </PageHeader>

      <section className="user-control-panel">
        <div className="theme-page">
          <div className="theme-scope">
            <span>Aplicar a</span>
            <SearchSelect onChange={(event) => setScope(event.target.value)} options={options} value={selectedScope} />
          </div>

          {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las organizaciones.")}</div> : null}
          {data && !isGlobalAdmin && organizations.length === 0 ? (
            <div className="empty-state">No hay organizaciones de su pais para configurar.</div>
          ) : null}

          {isEditingGlobal ? <ThemeEditor onSaved={reload} /> : null}
          {!isEditingGlobal && selectedOrganization ? (
            <ThemeEditor key={selectedOrganization.id} onSaved={reload} organization={selectedOrganization} />
          ) : null}
        </div>
      </section>
    </div>
  );
}
