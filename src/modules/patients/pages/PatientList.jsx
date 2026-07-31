import { Edit3, Plus, Search, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createPatient, deactivatePatient, listPatients, updatePatient } from "../../../api/endpoints/patients";
import { PageHeader } from "../../../shared/components/PageHeader";
import { DeactivatePatientDialog } from "../components/DeactivatePatientDialog";
import { PatientModal } from "../components/PatientModal";

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export function PatientList() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalState, setModalState] = useState({ isOpen: false, mode: "create", patient: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, patient: null });
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    listPatients()
      .then((payload) => {
        if (isMounted) {
          setPatients(Array.isArray(payload) ? payload : payload.results || []);
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

  const filteredPatients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return patients;

    return patients.filter((patient) => {
      const searchable = [patient.dni, patient.full_name, patient.first_name, patient.last_name, patient.phone, patient.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [patients, searchTerm]);

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
      const updatedPatient = await updatePatient(modalState.patient.id, payload);
      setPatients((current) => current.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient)));
    } else {
      const newPatient = await createPatient(payload);
      setPatients((current) => [newPatient, ...current]);
    }
    closePatientModal();
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
      setPatients((current) => current.filter((patient) => patient.id !== confirmState.patient.id));
      closeDeactivateDialog();
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

      <div className="toolbar">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Buscar paciente"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="DNI, nombre, telefono o correo"
          type="search"
          value={searchTerm}
        />
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

        {!isLoading && filteredPatients.length === 0 ? <div className="empty-state">Sin pacientes activos</div> : null}

        {!isLoading &&
          filteredPatients.map((patient) => (
            <article className="table-row patient-row" key={patient.id}>
              <span>{patient.dni || "Sin DNI"}</span>
              <strong>{patient.full_name}</strong>
              <span>{formatDate(patient.created_at)}</span>
              <div className="row-actions">
                <button className="icon-button" onClick={() => openEditModal(patient)} type="button" aria-label="Modificar paciente">
                  <Edit3 size={17} aria-hidden="true" />
                </button>
                <button
                  className="icon-button danger-icon-button"
                  onClick={() => openDeactivateDialog(patient)}
                  type="button"
                  aria-label="Desactivar paciente"
                >
                  <UserX size={17} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
      </div>

      {modalState.isOpen ? (
        <PatientModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          onClose={closePatientModal}
          onSubmit={handleSavePatient}
          patient={modalState.patient}
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
