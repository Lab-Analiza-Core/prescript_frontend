import { Edit3, Plus, Search, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ConfirmDialog } from "../../users/components/ConfirmDialog";
import { MedicineModal } from "../components/MedicineModal";
import { CATEGORY_LABELS, describeMedicine, entryKey, MEDICINE_CATEGORIES } from "../medicineConstants";
import {
  createOwnMedicine,
  deleteOwnMedicine,
  listDoctorCatalog,
  setEntryCategory,
  updateOwnMedicine,
} from "../services/medicineService";
import { PageHeader } from "../../../shared/components/PageHeader";
import { Pagination } from "../../../shared/components/Pagination";
import { SearchSelect } from "../../../shared/components/SearchSelect";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";
import { usePagedResource } from "../../../shared/hooks/usePagedResource";
import { getApiErrorMessage, getApiFieldErrors } from "../../../shared/utils/apiErrors";

import "../medicines.css";

const SEARCH_DELAY_MS = 350;

export function MedicineCatalog() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isExternal = Boolean(user?.isExternal);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, medicine: null });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const catalog = usePagedResource((page) => listDoctorCatalog({ search, category, page }), `${search}|${category}`);
  const entries = catalog.data || [];

  const toggleFavorite = async (entry) => {
    setBusyKey(entryKey(entry));
    try {
      await setEntryCategory(entry, entry.category === "favorite" ? "undetermined" : "favorite");
      catalog.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo actualizar el medicamento."), "error");
    } finally {
      setBusyKey("");
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, medicine: null });
    setFormErrors({});
  };

  const saveMedicine = async (payload) => {
    setIsSaving(true);
    setFormErrors({});
    try {
      if (modal.medicine) {
        await updateOwnMedicine(modal.medicine.doctor_medicine, payload);
        showToast("Medicamento actualizado.", "success");
      } else {
        await createOwnMedicine(payload);
        showToast("Medicamento agregado a su catalogo.", "success");
      }
      closeModal();
      catalog.reload();
    } catch (error) {
      setFormErrors(getApiFieldErrors(error));
      showToast(getApiErrorMessage(error, "No se pudo guardar el medicamento."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      await deleteOwnMedicine(toDelete.doctor_medicine);
      showToast("Medicamento eliminado del catalogo.", "success");
      setToDelete(null);
      catalog.reload();
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo eliminar el medicamento."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const hasFilters = Boolean(search || category);
  const emptyMessage = hasFilters
    ? "Ningun medicamento coincide con la busqueda."
    : isExternal
      ? "Todavia no tiene medicamentos. Agregue el primero para usarlo en sus recetas."
      : "No hay medicamentos disponibles para su pais.";

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <>
            {isExternal ? (
              <button className="primary-action compact" onClick={() => setModal({ isOpen: true, medicine: null })} type="button">
                <Plus size={18} aria-hidden="true" />
                Nuevo medicamento
              </button>
            ) : null}
            <button aria-expanded={showFilters} className="secondary-action compact" onClick={() => setShowFilters((current) => !current)} type="button">
              <SlidersHorizontal size={18} aria-hidden="true" />
              Filtros
            </button>
          </>
        }
        eyebrow="Medicamentos"
        title="Catalogo personalizado"
      >
        {isExternal
          ? "Sus medicamentos con dosis e indicaciones habituales, listos para recetar."
          : "Catalogo de su pais: marque sus favoritos para encontrarlos primero al recetar."}
      </PageHeader>

      <div className="medicine-toolbar">
        <div className="toolbar">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Buscar medicamento"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre o principio activo"
            value={searchInput}
          />
        </div>
        {showFilters ? (
          <div className="medicine-filters">
            <label>
              <span>Categoria</span>
              <SearchSelect aria-label="Filtrar por categoria" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Todas</option>
                {MEDICINE_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SearchSelect>
            </label>
          </div>
        ) : null}
      </div>

      {catalog.error ? <p className="form-error" role="alert">No se pudo cargar el catalogo de medicamentos.</p> : null}
      {catalog.isLoading && !catalog.data ? <div className="empty-state">Cargando medicamentos</div> : null}
      {catalog.data && entries.length === 0 ? <div className="empty-state">{emptyMessage}</div> : null}

      <div className="catalog-grid">
        {entries.map((entry) => {
          const isFavorite = entry.category === "favorite";
          return (
            <article className="medicine-card" key={entryKey(entry)}>
              <button
                aria-label={isFavorite ? "Quitar de favoritos" : "Marcar favorito"}
                aria-pressed={isFavorite}
                className={isFavorite ? "star-button selected" : "star-button"}
                disabled={busyKey === entryKey(entry)}
                onClick={() => toggleFavorite(entry)}
                type="button"
              >
                <Star size={18} aria-hidden="true" />
              </button>
              <strong>{entry.name}</strong>
              <span>{describeMedicine(entry)}</span>
              <small>{CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.undetermined}</small>
              {isExternal ? (
                <div className="medicine-card-actions">
                  <button aria-label={`Editar ${entry.name}`} className="icon-button" onClick={() => setModal({ isOpen: true, medicine: entry })} type="button">
                    <Edit3 size={17} aria-hidden="true" />
                  </button>
                  <button aria-label={`Eliminar ${entry.name}`} className="icon-button" onClick={() => setToDelete(entry)} type="button">
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <Pagination isLoading={catalog.isLoading} onPageChange={catalog.setPage} page={catalog.page} total={catalog.total} />

      {modal.isOpen ? (
        <MedicineModal errors={formErrors} isSaving={isSaving} medicine={modal.medicine} onClose={closeModal} onSubmit={saveMedicine} />
      ) : null}
      {toDelete
        ? createPortal(
            <ConfirmDialog
              isProcessing={isSaving}
              message={`Se quitara ${toDelete.name} de su catalogo. Las recetas ya emitidas conservan su nombre.`}
              onClose={() => setToDelete(null)}
              onConfirm={confirmDelete}
              title="Eliminar medicamento"
            />,
            document.body,
          )
        : null}
    </div>
  );
}
