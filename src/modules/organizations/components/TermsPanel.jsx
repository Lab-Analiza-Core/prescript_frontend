import { useState } from "react";
import { CheckCircle2, FilePlus2, FileText, Users } from "lucide-react";

import { activateTerms, listTermsVersions, publishTerms } from "../services/organizationService";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";

const emptyForm = { version: "", title: "Terminos y condiciones", content: "" };

export function TermsPanel() {
  const { showToast } = useToast();
  const { data, error, isLoading, reload } = useApiResource(listTermsVersions, "terms");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const versions = Array.isArray(data) ? data : data?.results || [];
  const current = versions.find((version) => version.is_current);
  // Sin seleccion explicita (o si desaparece) se muestra la vigente.
  const selected = versions.find((version) => version.id === selectedId) || current || versions[0];

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const openForm = (base) => {
    setForm(base ? { version: "", title: base.title, content: base.content } : emptyForm);
    setIsCreating(true);
  };

  const handlePublish = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const created = await publishTerms({ version: form.version.trim(), title: form.title.trim(), content: form.content.trim() });
      showToast("Version publicada. Los nuevos registros la aceptaran.", "success");
      setForm(emptyForm);
      setIsCreating(false);
      setSelectedId(created?.id ?? null);
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo publicar la version."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (version) => {
    const previous = current ? ` La version ${current.version} pasara a historial.` : "";
    if (!window.confirm(`Establecer la version ${version.version} como vigente?${previous} Los nuevos registros aceptaran esta version.`)) {
      return;
    }
    setIsSaving(true);
    try {
      await activateTerms(version.id);
      showToast(`La version ${version.version} es ahora la vigente.`, "success");
      reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo cambiar la version vigente."), "error");
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
              ? "Es la que aceptan los nuevos registros. Seleccione otra version para revisarla o establecerla como vigente."
              : "Mientras no se publiquen, nadie podra registrarse."}
          </small>
        </div>
        {!isCreating ? (
          <button className="primary-action compact" onClick={() => openForm(null)} type="button">
            Nueva version
          </button>
        ) : null}
      </div>

      {isCreating ? (
        <form className="modal-form user-form" onSubmit={handlePublish}>
          <label>
            <span>Version</span>
            <input autoFocus maxLength={30} name="version" onChange={updateField} placeholder="1.2" required value={form.version} />
          </label>
          <label>
            <span>Titulo</span>
            <input maxLength={200} name="title" onChange={updateField} required value={form.title} />
          </label>
          <label className="field-wide">
            <span>Contenido</span>
            <textarea className="terms-editor" name="content" onChange={updateField} required rows={8} value={form.content} />
          </label>
          <div className="field-wide terms-form-actions">
            <button className="primary-action compact" disabled={isSaving} type="submit">
              {isSaving ? "Publicando" : "Publicar y establecer como vigente"}
            </button>
            <button className="secondary-action" disabled={isSaving} onClick={() => setIsCreating(false)} type="button">
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {isLoading && !data ? <div className="empty-state">Cargando versiones</div> : null}
      {error ? <div className="empty-state">{getApiErrorMessage(error, "No se pudieron cargar las versiones.")}</div> : null}
      {!isLoading && !error && !versions.length ? <div className="empty-state">Todavia no hay versiones publicadas.</div> : null}

      {versions.length ? (
        <div className="terms-layout">
          <ul aria-label="Versiones publicadas" className="terms-version-list">
            {versions.map((version) => (
              <li key={version.id}>
                <button
                  aria-pressed={selected?.id === version.id}
                  className={`terms-version-card${selected?.id === version.id ? " selected" : ""}`}
                  onClick={() => setSelectedId(version.id)}
                  type="button"
                >
                  <span className="terms-version-head">
                    <strong>Version {version.version}</strong>
                    <span className={version.is_current ? "status-badge confirmed" : "status-badge cancelled"}>
                      {version.is_current ? "Vigente" : "Anterior"}
                    </span>
                  </span>
                  <small>{version.title}</small>
                  <small>
                    {new Date(version.published_at).toLocaleDateString()} · {version.acceptances_count ?? 0} aceptaciones
                  </small>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <section className="terms-detail" aria-label={`Version ${selected.version}`}>
              <header className="terms-detail-head">
                <div>
                  <h3>
                    <FileText size={18} aria-hidden="true" /> {selected.title}
                  </h3>
                  <small>
                    Version {selected.version} · publicada el {new Date(selected.published_at).toLocaleDateString()} ·{" "}
                    <Users size={12} aria-hidden="true" /> {selected.acceptances_count ?? 0} aceptaciones
                  </small>
                </div>
                {selected.is_current ? (
                  <span className="terms-current-flag">
                    <CheckCircle2 size={16} aria-hidden="true" /> Vigente
                  </span>
                ) : (
                  <button className="primary-action compact" disabled={isSaving} onClick={() => handleActivate(selected)} type="button">
                    Establecer como vigente
                  </button>
                )}
              </header>
              <div className="terms-box terms-preview">
                <p>{selected.content}</p>
              </div>
              <div className="terms-form-actions">
                <button className="secondary-action" onClick={() => openForm(selected)} type="button">
                  Crear nueva version desde esta
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
