import { FilePlus2, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { MedicinePicker } from "../components/MedicinePicker";
import { createPrescription } from "../services/prescriptionService";
import { describeMedicine, entryKey } from "../../medicines/medicineConstants";
import { listPatients } from "../../patients/services/patientService";
import { PageHeader } from "../../../shared/components/PageHeader";
import { SearchSelect } from "../../../shared/components/SearchSelect";
import { useToast } from "../../../shared/context/useToast";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";

import "../prescriptions.css";

const toRows = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

// Convierte una entrada del catalogo en un renglon de receta con sus valores habituales precargados.
const buildItem = (entry) => ({
  key: entryKey(entry),
  medicine: entry.medicine,
  doctor_medicine: entry.doctor_medicine,
  name: entry.name,
  detail: describeMedicine(entry),
  dosage: entry.default_dosage || "",
  frequency: entry.default_frequency || "",
  duration: entry.default_duration || "",
  instructions: entry.default_instructions || "",
});

const findProblem = (patientId, items) => {
  if (!patientId) return "Seleccione al paciente.";
  if (items.length === 0) return "Agregue al menos un medicamento.";
  const incomplete = items.find((item) => !item.dosage.trim() || !item.frequency.trim() || !item.duration.trim());
  if (incomplete) return `Complete dosis, frecuencia y duracion de ${incomplete.name}.`;
  return "";
};

export function PrescriptionEditor() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [patientId, setPatientId] = useState(searchParams.get("patient") || "");
  // La cita solo llega desde la agenda; si se cambia de paciente deja de aplicar.
  const [appointmentId, setAppointmentId] = useState(searchParams.get("appointment") || "");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const patients = useApiResource(() => listPatients({ isActive: "true" }), "active-patients");
  const patientOptions = useMemo(
    () => toRows(patients.data).map((patient) => ({ value: String(patient.id), label: patient.full_name })),
    [patients.data],
  );
  const selectedKeys = useMemo(() => new Set(items.map((item) => item.key)), [items]);

  const updateItem = (key, field, value) =>
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [field]: value } : item)));

  const addEntry = (entry) => {
    setItems((current) => (current.some((item) => item.key === entryKey(entry)) ? current : [...current, buildItem(entry)]));
    setProblem("");
  };

  const changePatient = (event) => {
    setPatientId(event.target.value);
    setAppointmentId("");
    setProblem("");
  };

  const submit = async () => {
    const message = findProblem(patientId, items);
    setProblem(message);
    if (message) return;

    setIsSaving(true);
    try {
      await createPrescription({
        patient: Number(patientId),
        appointment: appointmentId ? Number(appointmentId) : null,
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        items: items.map((item, index) => ({
          medicine: item.medicine,
          doctor_medicine: item.doctor_medicine,
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          instructions: item.instructions.trim(),
          sort_order: index,
        })),
      });
      showToast("Receta emitida.", "success");
      navigate(`/app/pacientes/${patientId}`, { state: { tab: "Recetas" } });
    } catch (error) {
      setProblem(getApiErrorMessage(error, "No se pudo emitir la receta."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <button className="primary-action compact" disabled={isSaving} onClick={submit} type="button">
            <Send size={18} aria-hidden="true" />
            {isSaving ? "Emitiendo" : "Emitir receta"}
          </button>
        }
        eyebrow="Recetas"
        title="Receta digital"
      >
        Indicaciones listas para revisar, firmar y compartir.
      </PageHeader>

      <div className="prescription-paper rx-paper">
        <label className="rx-field">
          <span>Paciente *</span>
          <SearchSelect aria-label="Paciente" onChange={changePatient} options={patientOptions} value={patientId}>
            <option value="">Seleccione al paciente</option>
          </SearchSelect>
        </label>
        <label className="rx-field">
          <span>Diagnostico</span>
          <input maxLength={500} onChange={(event) => setDiagnosis(event.target.value)} value={diagnosis} />
        </label>

        <h2>Indicaciones</h2>
        {items.length === 0 ? <p>Agregue productos y complete las indicaciones antes de emitir.</p> : null}

        <ol className="rx-items">
          {items.map((item) => (
            <li className="rx-item" key={item.key}>
              <header>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </div>
                <button
                  aria-label={`Quitar ${item.name}`}
                  className="icon-button"
                  onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))}
                  type="button"
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </header>
              <div className="rx-item-fields">
                <label>
                  <span>Dosis *</span>
                  <input maxLength={120} onChange={(event) => updateItem(item.key, "dosage", event.target.value)} value={item.dosage} />
                </label>
                <label>
                  <span>Frecuencia *</span>
                  <input maxLength={120} onChange={(event) => updateItem(item.key, "frequency", event.target.value)} value={item.frequency} />
                </label>
                <label>
                  <span>Duracion *</span>
                  <input maxLength={120} onChange={(event) => updateItem(item.key, "duration", event.target.value)} value={item.duration} />
                </label>
                <label className="rx-item-wide">
                  <span>Indicaciones medicas</span>
                  <textarea onChange={(event) => updateItem(item.key, "instructions", event.target.value)} rows={2} value={item.instructions} />
                </label>
              </div>
            </li>
          ))}
        </ol>

        <button className="secondary-action rx-add" onClick={() => setIsPickerOpen(true)} type="button">
          <FilePlus2 size={18} aria-hidden="true" />
          Agregar medicamento
        </button>

        <label className="rx-field">
          <span>Notas generales</span>
          <textarea onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} />
        </label>

        {problem ? <p className="form-error rx-problem" role="alert">{problem}</p> : null}
      </div>

      {isPickerOpen ? <MedicinePicker onAdd={addEntry} onClose={() => setIsPickerOpen(false)} selectedKeys={selectedKeys} /> : null}
    </div>
  );
}
