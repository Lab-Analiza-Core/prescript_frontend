import { useState } from "react";
import { FilePlus2 } from "lucide-react";

import { listTermsVersions, publishTerms } from "../services/organizationService";
import { Pagination } from "../../../shared/components/Pagination";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { usePagedRows } from "../../../shared/hooks/usePagedResource";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";

const emptyForm = { version: "", title: "Terminos y condiciones", content: "" };

export function TermsPanel() {
  const { showToast } = useToast();
  const { data, error, isLoading, reload } = useApiResource(listTermsVersions, "terms");
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const versions = Array.isArray(data) ? data : data?.results || [];
  const current = versions.find((version) => version.is_current);
  const paged = usePagedRows(versions);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handlePublish = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await publishTerms({ version: form.version.trim(), title: form.title.trim(), content: form.content.trim() });
      showToast("Version publicada. Los nuevos registros la aceptaran.", "success");
      setForm(emptyForm);
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo publicar la version."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel-stack">
      <div className="org-summary">
        <FilePlus2 size={20} aria-hidden="true" />
        <div>
          <strong>{current ? `Version vigente: ${current.version}` : "Aun no hay terminos publicados"}</strong>
          <small>
            {current
              ? "Publicar una version nueva la vuelve la vigente; las anteriores se conservan como historial."
              : "Mientras no se publiquen, nadie podra registrarse."}
          </small>
        </div>
      </div>

      <form className="modal-form user-form" onSubmit={handlePublish}>
        <label>
          <span>Version</span>
          <input maxLength={30} name="version" onChange={updateField} placeholder="1.0" required value={form.version} />
        </label>
        <label>
          <span>Titulo</span>
          <input maxLength={200} name="title" onChange={updateField} required value={form.title} />
        </label>
        <label className="field-wide">
          <span>Contenido</span>
          <textarea className="terms-editor" name="content" onChange={updateField} required rows={8} value={form.content} />
        </label>
        <div className="field-wide">
          <button className="primary-action compact" disabled={isSaving} type="submit">
            {isSaving ? "Publicando" : "Publicar version"}
          </button>
        </div>
      </form>

      <div className="user-table">
        <div className="table-row table-head admin-row" style={{ "--cols": "0.6fr 1.6fr 1fr 0.7fr" }}>
          <span>Version</span>
          <span>Titulo</span>
          <span>Publicada</span>
          <span>Estado</span>
        </div>
        {isLoading && !data ? <div className="empty-state">Cargando versiones</div> : null}
        {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las versiones.")}</div> : null}
        {paged.rows.map((version) => (
          <article className="table-row admin-row" key={version.id} style={{ "--cols": "0.6fr 1.6fr 1fr 0.7fr" }}>
            <strong>{version.version}</strong>
            <span>{version.title}</span>
            <span>{new Date(version.published_at).toLocaleDateString()}</span>
            <span className={version.is_current ? "status-badge confirmed" : "status-badge cancelled"}>
              {version.is_current ? "Vigente" : "Anterior"}
            </span>
          </article>
        ))}
        <Pagination onPageChange={paged.setPage} page={paged.page} total={paged.total} />
      </div>
    </div>
  );
}
