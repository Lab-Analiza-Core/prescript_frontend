import { Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CATEGORY_LABELS, describeMedicine, entryKey } from "../../medicines/medicineConstants";
import { listDoctorCatalog } from "../../medicines/services/medicineService";
import { Pagination } from "../../../shared/components/Pagination";
import { usePagedResource } from "../../../shared/hooks/usePagedResource";

const SEARCH_DELAY_MS = 350;

// Elige medicamentos del catalogo del medico para la receta; los favoritos aparecen primero.
export function MedicinePicker({ onAdd, onClose, selectedKeys }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const catalog = usePagedResource((page) => listDoctorCatalog({ search, page }), search);
  const entries = catalog.data || [];

  // En un portal: la animacion de la ruta deja un transform que confina los elementos fixed.
  return createPortal(
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar selector" />
      <section className="form-modal profile-modal medicine-picker" aria-labelledby="picker-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Receta</span>
            <h2 id="picker-title">Agregar medicamento</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="picker-body">
          <div className="toolbar">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Buscar en su catalogo"
              autoFocus
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por nombre o principio activo"
              value={searchInput}
            />
          </div>

          {catalog.error ? <p className="form-error" role="alert">No se pudo cargar el catalogo.</p> : null}
          {catalog.data && entries.length === 0 ? (
            <div className="empty-state">
              {search ? "Ningun medicamento coincide." : "Su catalogo esta vacio. Agregue medicamentos desde la seccion Medicamentos."}
            </div>
          ) : null}

          <ul className="picker-list">
            {entries.map((entry) => {
              const isSelected = selectedKeys.has(entryKey(entry));
              return (
                <li key={entryKey(entry)}>
                  <div>
                    <strong>{entry.name}</strong>
                    <span>{describeMedicine(entry)}</span>
                    {entry.category !== "undetermined" ? <small>{CATEGORY_LABELS[entry.category]}</small> : null}
                  </div>
                  <button className="secondary-action compact" disabled={isSelected} onClick={() => onAdd(entry)} type="button">
                    <Plus size={16} aria-hidden="true" />
                    {isSelected ? "Agregado" : "Agregar"}
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination isLoading={catalog.isLoading} onPageChange={catalog.setPage} page={catalog.page} total={catalog.total} />
        </div>

        <div className="modal-actions">
          <button className="primary-action compact" onClick={onClose} type="button">
            Listo
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
