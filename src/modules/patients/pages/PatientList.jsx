import { Edit3, Filter, Plus, Search, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createPatient, deactivatePatient, listPatients, updatePatient } from "../services/patientService";
import { listDoctors } from "../../../shared/services/doctorService";
import { PageHeader } from "../../../shared/components/PageHeader";
import { Pagination } from "../../../shared/components/Pagination";
import { useAuth } from "../../../shared/context/useAuth";
import { DeactivatePatientDialog } from "../components/DeactivatePatientDialog";
import { PatientModal } from "../components/PatientModal";
import { getCountryLocale } from "../../../shared/utils/countryUtils";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const formatDate = (value, locale) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const toRows = (payload) => (Array.isArray(payload) ? payload : payload.results || []);
const toTotal = (payload) => (Array.isArray(payload) ? payload.length : payload.count ?? toRows(payload).length);

const emptyFilters = { search: "", doctor: "", sex: "", isActive: "", createdFrom: "", createdTo: "" };

export function PatientList() {
  const { user } = useAuth();
  const locale = getCountryLocale(user?.country);
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalState, setModalState] = useState({ isOpen: false, mode: "create", patient: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, patient: null });
  const [isDeactivating, setIsDeactivating] = useState(false);
  const requiresDoctor = user?.role !== "doctor";

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter((value) => String(value).trim()).length,
    [filters],
  );

  const loadPatients = useCallback(async (nextFilters, nextPage = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      let payload;
      let resolvedPage = nextPage;
      try {
        payload = await listPatients({ ...nextFilters, page: nextPage });
      } catch (error) {
        // Pagina fuera de rango (p. ej. se quedo sin filas): se retrocede una.
        if (error.response?.status !== 404 || nextPage <= 1) throw error;
        resolvedPage = nextPage - 1;
        payload = await listPatients({ ...nextFilters, page: resolvedPage });
      }
      setPage(resolvedPage);
      setPatients(toRows(payload));
      setTotal(toTotal(payload));
    } catch {
      setErrorMessage("No se pudo cargar el directorio de pacientes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    listPatients({ ...emptyFilters, page: 1 })
      .then((payload) => {
        if (isMounted) {
          setPatients(toRows(payload));
          setTotal(toTotal(payload));
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("No se pudo cargar el directorio de pacientes.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    loadPatients(emptyFilters);
  };

  useEffect(() => {
    if (!requiresDoctor) return undefined;

    let isMounted = true;
    listDoctors()
      .then((payload) => {
        if (isMounted) {
          setDoctorOptions(Array.isArray(payload) ? payload : payload.results || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("No se pudo cargar la lista de doctores.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requiresDoctor]);

  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: "create", patient: null });
  };

  const openEditModal = (patient) => {
    setModalState({ isOpen: true, mode: "edit", patient });
  };

  const closePatientModal = () => {
    setModalState((current) => ({ ...current, isOpen: false }));
  };

  const handleSavePatient = async (payload) => {
    if (modalState.mode === "edit" && modalState.patient) {
      await updatePatient(modalState.patient.id, payload);
    } else {
      await createPatient(payload);
    }
    closePatientModal();
    await loadPatients(filters, page);
  };

  const openDeactivateDialog = (patient) => {
    setConfirmState({ isOpen: true, patient });
  };

  const closeDeactivateDialog = () => {
    setConfirmState({ isOpen: false, patient: null });
  };

  const handleDeactivatePatient = async () => {
    if (!confirmState.patient) return;

    setIsDeactivating(true);
    try {
      await deactivatePatient(confirmState.patient.id);
      closeDeactivateDialog();
      await loadPatients(filters, page);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <button className="primary-action compact" onClick={openCreateModal} type="button">
            <Plus size={18} aria-hidden="true" />
            Paciente
          </button>
        }
        eyebrow="Pacientes"
        title="Directorio clinico"
      >
        Lista activa para consulta, retorno y continuidad.
      </PageHeader>

      <div className="user-control-panel">
        <div className="user-control-header">
          <div>
            <h2>Todos los pacientes</h2>
            <span>{total} registros</span>
          </div>
          <div className="user-control-actions">
            <div className="toolbar user-search">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label="Buscar paciente"
                onChange={(event) => updateFilter("search", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadPatients(filters, 1);
                }}
                placeholder="DNI, nombre, telefono o correo"
                type="search"
                value={filters.search}
              />
            </div>
            <button
              className={showFilters || activeFiltersCount ? "secondary-action compact filter-active" : "secondary-action compact"}
              onClick={() => setShowFilters((value) => !value)}
              type="button"
            >
              <Filter size={17} aria-hidden="true" />
              Filtros
              {activeFiltersCount ? <span className="filter-count">{activeFiltersCount}</span> : null}
            </button>
            <button className="secondary-action compact" onClick={() => loadPatients(filters, 1)} type="button">
              <Search size={17} aria-hidden="true" />
              Buscar
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="patient-filters">
            {requiresDoctor ? (
              <label>
                <span>Doctor</span>
                <SearchSelect value={filters.doctor} onChange={(event) => updateFilter("doctor", event.target.value)}>
                  <option value="">Todos</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </option>
                  ))}
                </SearchSelect>
              </label>
            ) : null}
            <label>
              <span>Sexo</span>
              <SearchSelect value={filters.sex} onChange={(event) => updateFilter("sex", event.target.value)}>
                <option value="">Todos</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="O">Otro</option>
              </SearchSelect>
            </label>
            <label>
              <span>Estado</span>
              <SearchSelect value={filters.isActive} onChange={(event) => updateFilter("isActive", event.target.value)}>
                <option value="">Activos</option>
                <option value="false">Inactivos</option>
                <option value="all">Todos</option>
              </SearchSelect>
            </label>
            <label>
              <span>Registrado desde</span>
              <input max={filters.createdTo || undefined} onChange={(event) => updateFilter("createdFrom", event.target.value)} type="date" value={filters.createdFrom} />
            </label>
            <label>
              <span>Registrado hasta</span>
              <input min={filters.createdFrom || undefined} onChange={(event) => updateFilter("createdTo", event.target.value)} type="date" value={filters.createdTo} />
            </label>
            <div className="user-filter-buttons">
              <button className="secondary-action compact" onClick={clearFilters} type="button">
                Limpiar
              </button>
              <button className="primary-action compact" onClick={() => loadPatients(filters, 1)} type="button">
                Aplicar
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <div className="table-panel patient-table">
        <div className="table-row table-head patient-row">
          <span>DNI</span>
          <span>Nombre completo</span>
          <span>Registrado</span>
          <span>Acciones</span>
        </div>

        {isLoading ? <div className="empty-state">Cargando pacientes</div> : null}

        {!isLoading && patients.length === 0 ? <div className="empty-state">Sin pacientes activos</div> : null}

        {!isLoading &&
          patients.map((patient) => (
            <article className="table-row patient-row" key={patient.id}>
              <span>{patient.dni || "Sin DNI"}</span>
              <strong>{patient.full_name}{patient.is_active === false ? " (inactivo)" : ""}</strong>
              <span>{formatDate(patient.created_at, locale)}</span>
              <div className="row-actions">
                <button className="icon-button" onClick={() => openEditModal(patient)} type="button" aria-label="Modificar paciente">
                  <Edit3 size={17} aria-hidden="true" />
                </button>
                {patient.is_active === false ? null : (
                  <button
                    className="icon-button danger-icon-button"
                    onClick={() => openDeactivateDialog(patient)}
                    type="button"
                    aria-label="Desactivar paciente"
                  >
                    <UserX size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          ))}
        <Pagination isLoading={isLoading} onPageChange={(nextPage) => loadPatients(filters, nextPage)} page={page} total={total} />
      </div>

      {modalState.isOpen ? (
        <PatientModal
          isOpen={modalState.isOpen}
          country={user?.country}
          doctorOptions={doctorOptions}
          mode={modalState.mode}
          onClose={closePatientModal}
          onSubmit={handleSavePatient}
          patient={modalState.patient}
          requiresDoctor={requiresDoctor}
        />
      ) : null}

      <DeactivatePatientDialog
        isOpen={confirmState.isOpen}
        isProcessing={isDeactivating}
        onClose={closeDeactivateDialog}
        onConfirm={handleDeactivatePatient}
        patient={confirmState.patient}
      />
    </div>
  );
}
