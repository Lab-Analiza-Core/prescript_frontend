import { CalendarClock, FileText, Save, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  listPreclinicAppointments,
  listPreclinicPatients,
  savePreclinicPatientVitals,
  savePreclinicVitals,
} from "../../../api/endpoints/preclinic";
import { PageHeader } from "../../../shared/components/PageHeader";

const today = () => new Date().toISOString().slice(0, 10);

const emptyVitals = {
  blood_pressure_systolic: "",
  blood_pressure_diastolic: "",
  oxygen_saturation: "",
  temperature: "",
  height_cm: "",
  weight_kg: "",
};

const toFormValue = (value) => (value === null || value === undefined ? "" : String(value));

const buildForm = (record) => {
  const current = record?.current_vitals || {};
  const comparison = record?.comparison_vitals || {};
  return {
    blood_pressure_systolic: toFormValue(current.blood_pressure_systolic ?? comparison.blood_pressure_systolic),
    blood_pressure_diastolic: toFormValue(current.blood_pressure_diastolic ?? comparison.blood_pressure_diastolic),
    oxygen_saturation: toFormValue(current.oxygen_saturation),
    temperature: toFormValue(current.temperature),
    height_cm: record?.is_pediatric ? toFormValue(current.height_cm ?? comparison.height_cm) : "",
    weight_kg: toFormValue(current.weight_kg ?? comparison.weight_kg),
  };
};

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

const formatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export function PreclinicCapture() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedSource, setSelectedSource] = useState({ type: "", id: "" });
  const [form, setForm] = useState(emptyVitals);
  const [selectedDate, setSelectedDate] = useState(today());
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      listPreclinicAppointments(selectedDate),
      listPreclinicPatients({ date: selectedDate, search: patientSearch }),
    ])
      .then(([appointmentPayload, patientPayload]) => {
        if (!isMounted) return;
        const appointmentRows = Array.isArray(appointmentPayload) ? appointmentPayload : [];
        const patientRows = Array.isArray(patientPayload) ? patientPayload : [];
        const nextSelection = appointmentRows[0] ? { ...appointmentRows[0], source: "appointment" } : patientRows[0] || null;
        setAppointments(appointmentRows);
        setPatients(patientRows);
        setSelectedSource(nextSelection ? { type: nextSelection.source || "appointment", id: String(nextSelection.id) } : { type: "", id: "" });
        setForm(nextSelection ? buildForm(nextSelection) : emptyVitals);
      })
      .catch(() => {
        if (isMounted) {
          setAppointments([]);
          setPatients([]);
          setSelectedSource({ type: "", id: "" });
          setForm(emptyVitals);
          setErrorMessage("No se pudo cargar preclinica.");
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
  }, [selectedDate, patientSearch]);

  const selectedRecord = useMemo(() => {
    if (selectedSource.type === "appointment") {
      return appointments.find((appointment) => String(appointment.id) === selectedSource.id);
    }
    return patients.find((patient) => String(patient.id) === selectedSource.id);
  }, [appointments, patients, selectedSource]);

  const comparison = selectedRecord?.comparison_vitals;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setIsLoading(true);
    setMessage("");
    setErrorMessage("");
  };

  const selectRecord = (type, record) => {
    setSelectedSource({ type, id: String(record.id) });
    setForm(buildForm(record));
    setMessage("");
    setErrorMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedRecord) return;

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      const payload = {
        blood_pressure_systolic: numberOrNull(form.blood_pressure_systolic),
        blood_pressure_diastolic: numberOrNull(form.blood_pressure_diastolic),
        oxygen_saturation: numberOrNull(form.oxygen_saturation),
        temperature: numberOrNull(form.temperature),
        height_cm: selectedRecord.is_pediatric ? numberOrNull(form.height_cm) : null,
        weight_kg: numberOrNull(form.weight_kg),
      };
      const updated =
        selectedSource.type === "appointment"
          ? await savePreclinicVitals(selectedRecord.id, payload)
          : await savePreclinicPatientVitals(selectedRecord.patient, payload, selectedDate);

      if (selectedSource.type === "appointment") {
        setAppointments((current) => current.map((appointment) => (appointment.id === updated.id ? updated : appointment)));
      } else {
        setPatients((current) => current.map((patient) => (patient.id === updated.id ? updated : patient)));
      }
      setForm(buildForm(updated));
      setMessage("Signos vitales guardados en el expediente del paciente.");
    } catch {
      setErrorMessage("No se pudieron guardar los signos vitales.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Preclinica" title="Signos vitales">
        Captura clinica asociada al expediente del paciente registrado.
      </PageHeader>

      <div className="toolbar preclinic-toolbar">
        <CalendarClock size={18} aria-hidden="true" />
        <input aria-label="Fecha de preclinica" onChange={handleDateChange} type="date" value={selectedDate} />
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}

      <div className="preclinic-layout">
        <section className="list-panel preclinic-list" aria-label="Pacientes para preclinica">
          {isLoading ? <div className="empty-state">Cargando registros</div> : null}

          <div className="preclinic-section-title">Citas de la fecha</div>
          {!isLoading && appointments.length === 0 ? <div className="empty-state">Sin citas para esta fecha</div> : null}
          {!isLoading &&
            appointments.map((appointment) => (
              <button
                className={selectedSource.type === "appointment" && String(appointment.id) === selectedSource.id ? "preclinic-appointment active" : "preclinic-appointment"}
                key={`appointment-${appointment.id}`}
                onClick={() => selectRecord("appointment", appointment)}
                type="button"
              >
                <span>{formatTime(appointment.scheduled_at)}</span>
                <strong>{appointment.patient_name}</strong>
                <small>{appointment.patient_dni ? `DNI ${appointment.patient_dni}` : `Paciente #${appointment.patient}`}</small>
              </button>
            ))}

          <div className="preclinic-section-title">Pacientes registrados</div>
          <div className="preclinic-search">
            <input
              aria-label="Buscar paciente registrado"
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Buscar por nombre, DNI o telefono"
              type="search"
              value={patientSearch}
            />
          </div>
          {!isLoading && patients.length === 0 ? <div className="empty-state">Sin pacientes registrados</div> : null}
          {!isLoading &&
            patients.map((patient) => (
              <button
                className={selectedSource.type === "patient" && String(patient.id) === selectedSource.id ? "preclinic-appointment active" : "preclinic-appointment"}
                key={`patient-${patient.id}`}
                onClick={() => selectRecord("patient", patient)}
                type="button"
              >
                <span>#{patient.patient}</span>
                <strong>{patient.patient_name}</strong>
                <small>{patient.patient_dni ? `DNI ${patient.patient_dni}` : patient.doctor_name}</small>
              </button>
            ))}
        </section>

        <form className="form-grid preclinic-form" onSubmit={handleSave}>
          <div className="preclinic-patient">
            <Stethoscope size={20} aria-hidden="true" />
            <div>
              <strong>{selectedRecord?.patient_name || "Seleccione un paciente registrado"}</strong>
              {selectedRecord ? (
                <span>{`Paciente registrado #${selectedRecord.patient}${selectedRecord.patient_dni ? ` - DNI ${selectedRecord.patient_dni}` : ""}`}</span>
              ) : null}
            </div>
            {selectedRecord ? (
              <Link className="secondary-action compact preclinic-patient-link" to={`/app/pacientes/${selectedRecord.patient}`}>
                <FileText size={17} aria-hidden="true" />
                Expediente
              </Link>
            ) : null}
          </div>

          {selectedRecord ? (
            <div className="preclinic-context">
              <span>{selectedSource.type === "appointment" ? selectedRecord.reason || "Sin motivo registrado" : "Captura sin cita"}</span>
              <span>{selectedRecord.doctor_name}</span>
              <span>{selectedRecord.is_pediatric ? "Altura habilitada por pediatria" : "Altura no aplica para esta especialidad"}</span>
            </div>
          ) : null}

          <div className="auth-grid">
            <label>
              <span>Presion sistolica</span>
              <input name="blood_pressure_systolic" onChange={handleChange} type="number" value={form.blood_pressure_systolic} />
              <small>Previo: {comparison?.blood_pressure_systolic || "sin dato"}</small>
            </label>

            <label>
              <span>Presion diastolica</span>
              <input name="blood_pressure_diastolic" onChange={handleChange} type="number" value={form.blood_pressure_diastolic} />
              <small>Previo: {comparison?.blood_pressure_diastolic || "sin dato"}</small>
            </label>
          </div>

          <div className="auth-grid">
            <label>
              <span>Oxigenacion</span>
              <input max="100" min="0" name="oxygen_saturation" onChange={handleChange} step="0.1" type="number" value={form.oxygen_saturation} />
              <small>Solo captura actual</small>
            </label>

            <label>
              <span>Temperatura</span>
              <input name="temperature" onChange={handleChange} step="0.1" type="number" value={form.temperature} />
              <small>Solo captura actual</small>
            </label>
          </div>

          <div className="auth-grid">
            <label>
              <span>Altura</span>
              <input disabled={!selectedRecord?.is_pediatric} name="height_cm" onChange={handleChange} step="0.1" type="number" value={form.height_cm} />
              <small>{selectedRecord?.is_pediatric ? `Previo: ${comparison?.height_cm || "sin dato"}` : "Solo pediatria"}</small>
            </label>

            <label>
              <span>Peso</span>
              <input name="weight_kg" onChange={handleChange} step="0.1" type="number" value={form.weight_kg} />
              <small>Previo: {comparison?.weight_kg || "sin dato"}</small>
            </label>
          </div>

          <button className="primary-action compact" disabled={!selectedRecord || isSaving} type="submit">
            <Save size={18} aria-hidden="true" />
            {isSaving ? "Guardando" : "Guardar signos"}
          </button>
        </form>
      </div>
    </div>
  );
}
