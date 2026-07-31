import { FileText, HeartPulse, MessageCircle, UserRound, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { getPatient } from "../../../api/endpoints/patients";
import { PageHeader } from "../../../shared/components/PageHeader";

const tabs = [
  { label: "Clinico", icon: HeartPulse },
  { label: "Preclinica", icon: FileText },
  { label: "Recetas", icon: FileText },
  { label: "Comercial", icon: WalletCards },
];

const formatDate = (value) => {
  if (!value) return "Sin dato";
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const calculateAge = (value) => {
  if (!value) return "Sin dato";
  const birthDate = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return `${age} años`;
};

const listValue = (values) => {
  if (!Array.isArray(values) || values.length === 0) return "Sin dato";
  return values.filter(Boolean).join(", ") || "Sin dato";
};

const sexLabels = {
  F: "Femenino",
  M: "Masculino",
  O: "Otro",
};

const bloodPressure = (vitals) => {
  if (!vitals?.blood_pressure_systolic && !vitals?.blood_pressure_diastolic) return "Sin dato";
  return `${vitals.blood_pressure_systolic || "-"} / ${vitals.blood_pressure_diastolic || "-"}`;
};

function VitalMetric({ label, value, unit }) {
  return (
    <div className="metric-card patient-vital-card">
      <span>{label}</span>
      <strong>
        {value || "Sin dato"}
        {value && unit ? <small>{unit}</small> : null}
      </strong>
    </div>
  );
}

export function PatientDetail() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("Clinico");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    getPatient(patientId)
      .then((payload) => {
        if (isMounted) {
          setPatient(payload);
          setErrorMessage("");
        }
      })
      .catch(() => {
        if (isMounted) {
          setPatient(null);
          setErrorMessage("No se pudo cargar el expediente del paciente.");
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
  }, [patientId]);

  const profile = patient?.medical_profile || {};
  const latestVitals = patient?.latest_vitals;
  const recentVitals = useMemo(() => patient?.recent_vitals || [], [patient]);

  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <button className="secondary-action compact" type="button">
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp
          </button>
        }
        eyebrow="Paciente"
        title={patient?.full_name || "Expediente del paciente"}
      >
        Antecedentes, signos vitales recientes y datos de seguimiento.
      </PageHeader>

      <div className="tabs-row">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button className={activeTab === tab.label ? "tab active" : "tab"} key={tab.label} onClick={() => setActiveTab(tab.label)} type="button">
              <Icon size={17} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {isLoading ? <div className="empty-state">Cargando expediente</div> : null}

      {!isLoading && patient && activeTab === "Clinico" ? (
        <>
          <div className="patient-summary-grid">
            <section className="detail-panel">
              <h2>
                <UserRound size={19} aria-hidden="true" />
                Identificacion
              </h2>
              <dl className="detail-grid">
                <div>
                  <dt>DNI</dt>
                  <dd>{patient.dni || "Sin dato"}</dd>
                </div>
                <div>
                  <dt>Edad</dt>
                  <dd>{calculateAge(patient.birth_date)}</dd>
                </div>
                <div>
                  <dt>Sexo</dt>
                  <dd>{sexLabels[patient.sex] || "Sin dato"}</dd>
                </div>
                <div>
                  <dt>Telefono</dt>
                  <dd>{patient.phone || "Sin dato"}</dd>
                </div>
                <div>
                  <dt>Correo</dt>
                  <dd>{patient.email || "Sin dato"}</dd>
                </div>
                <div>
                  <dt>Registrado</dt>
                  <dd>{formatDate(patient.created_at)}</dd>
                </div>
              </dl>
            </section>

            <section className="detail-panel">
              <h2>
                <HeartPulse size={19} aria-hidden="true" />
                Informacion medica
              </h2>
              <dl className="detail-grid">
                <div>
                  <dt>Alergias</dt>
                  <dd>{listValue(profile.allergies)}</dd>
                </div>
                <div>
                  <dt>Condiciones cronicas</dt>
                  <dd>{listValue(profile.chronic_conditions)}</dd>
                </div>
                <div>
                  <dt>Tipo de sangre</dt>
                  <dd>{profile.blood_type || "Sin dato"}</dd>
                </div>
                <div className="field-wide">
                  <dt>Notas clinicas</dt>
                  <dd>{profile.clinical_notes || "Sin notas clinicas registradas"}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="detail-panel">
            <h2>Ultimos signos vitales</h2>
            <div className="metric-grid">
              <VitalMetric label="Presion arterial" value={bloodPressure(latestVitals)} />
              <VitalMetric label="Oxigenacion" value={latestVitals?.oxygen_saturation} unit="%" />
              <VitalMetric label="Temperatura" value={latestVitals?.temperature} unit="C" />
              <VitalMetric label="Altura" value={latestVitals?.height_cm} unit="cm" />
              <VitalMetric label="Peso" value={latestVitals?.weight_kg} unit="kg" />
            </div>
            <p className="patient-muted-line">Ultima captura: {formatDateTime(latestVitals?.recorded_at)}</p>
          </section>
        </>
      ) : null}

      {!isLoading && patient && activeTab === "Preclinica" ? (
        <section className="table-panel">
          {recentVitals.length === 0 ? <div className="empty-state">Sin capturas de preclinica</div> : null}
          {recentVitals.map((vitals) => (
            <article className="table-row preclinic-history-row" key={vitals.id}>
              <strong>{formatDateTime(vitals.recorded_at)}</strong>
              <span>PA {bloodPressure(vitals)}</span>
              <span>SpO2 {vitals.oxygen_saturation || "-"}</span>
              <span>T {vitals.temperature || "-"}</span>
              <span>Peso {vitals.weight_kg || "-"}</span>
            </article>
          ))}
        </section>
      ) : null}

      {!isLoading && patient && activeTab === "Recetas" ? (
        <section className="detail-panel">
          <h2>Recetas</h2>
          <p className="patient-muted-line">Historial de recetas pendiente de conectar al expediente.</p>
        </section>
      ) : null}

      {!isLoading && patient && activeTab === "Comercial" ? (
        <section className="detail-panel">
          <h2>Actividad comercial</h2>
          <dl className="detail-grid">
            <div>
              <dt>Score</dt>
              <dd>{patient.patient_score}</dd>
            </div>
            <div className="field-wide">
              <dt>Notas comerciales</dt>
              <dd>{patient.commercial_notes || "Sin notas comerciales"}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
