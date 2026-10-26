import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplets,
  FileText,
  HeartPulse,
  History,
  Ruler,
  Save,
  Stethoscope,
  Thermometer,
  Weight,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { medicalListFromText } from "../preclinicUtils";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const hasRecordedValue = (value) => value !== null && value !== undefined && value !== "";
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const previewValue = (value, unit = "") =>
  hasRecordedValue(value) ? `${value}${unit ? ` ${unit}` : ""}` : "Sin registrar";

function PreviewList({ items }) {
  if (!items.length) return <span className="review-empty-value">Sin registrar</span>;
  return (
    <span className="review-chip-list">
      {items.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
    </span>
  );
}

function VitalField({
  compact = false,
  description,
  disabled = false,
  helper,
  icon: Icon,
  label,
  max,
  min = "0",
  name,
  onChange,
  previous,
  step = "0.1",
  tone = "primary",
  unit,
  value,
}) {
  const hintId = `${name}-hint`;
  const previousText = hasRecordedValue(previous)
    ? `Anterior: ${previous} ${unit}`
    : helper || "Sin registro anterior";

  return (
    <label className={`vital-field ${compact ? "vital-field-compact" : "vital-card"} vital-tone-${tone}${disabled ? " is-disabled" : ""}`}>
      <span className="vital-field-heading">
        {Icon ? (
          <span className="vital-card-icon" aria-hidden="true">
            <Icon size={19} />
          </span>
        ) : null}
        <span className="vital-field-title">
          <strong>{label}</strong>
          {description ? <small>{description}</small> : null}
        </span>
      </span>

      <span className="vital-input-shell">
        <input
          aria-describedby={hintId}
          autoComplete="off"
          disabled={disabled}
          inputMode="decimal"
          max={max}
          min={min}
          name={name}
          onChange={onChange}
          step={step}
          type="number"
          value={value}
        />
        <span className="vital-unit" aria-hidden="true">{unit}</span>
      </span>

      <small className={hasRecordedValue(previous) ? "vital-previous has-value" : "vital-previous"} id={hintId}>
        <History size={13} aria-hidden="true" />
        {previousText}
      </small>
    </label>
  );
}

export function PreclinicVitalsModal({
  comparison,
  form,
  isFutureDate,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  selectedRecord,
  selectedSource,
}) {
  const [activeStep, setActiveStep] = useState(1);
  const allergyItems = medicalListFromText(form.allergies || "");
  const chronicConditionItems = medicalListFromText(form.chronic_conditions || "");
  const clinicalNotes = form.clinical_notes.trim();
  const pressureValue = hasRecordedValue(form.blood_pressure_systolic) || hasRecordedValue(form.blood_pressure_diastolic)
    ? `${form.blood_pressure_systolic || "-"} / ${form.blood_pressure_diastolic || "-"} mmHg`
    : "Sin registrar";

  const handleSubmit = (event) => {
    if (activeStep < 3) {
      event.preventDefault();
      setActiveStep((current) => current + 1);
      return;
    }
    onSubmit(event);
  };

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar captura de signos" />
      <section className="form-modal preclinic-modal" aria-labelledby="preclinic-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className="doctor-avatar">
            <Stethoscope size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Preclinica</span>
            <h2 id="preclinic-modal-title">{selectedRecord?.patient_name || "Signos vitales"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className="preclinic-modal-summary">
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
        </div>

        <form className="form-grid preclinic-form preclinic-modal-form" onSubmit={handleSubmit}>
          <nav className="preclinic-wizard-steps" aria-label="Pasos de la preclinica">
            <button
              aria-label="Paso 1: Información médica"
              aria-current={activeStep === 1 ? "step" : undefined}
              className={activeStep === 1 ? "preclinic-wizard-step active" : "preclinic-wizard-step completed"}
              onClick={() => setActiveStep(1)}
              type="button"
            >
              <span>1</span>
              <span>
                <strong>Información médica</strong>
                <small>Antecedentes del paciente</small>
              </span>
            </button>
            <span className={activeStep > 1 ? "preclinic-wizard-line completed" : "preclinic-wizard-line"} aria-hidden="true" />
            <button
              aria-label="Paso 2: Signos vitales"
              aria-current={activeStep === 2 ? "step" : undefined}
              className={activeStep === 2 ? "preclinic-wizard-step active" : activeStep > 2 ? "preclinic-wizard-step completed" : "preclinic-wizard-step"}
              onClick={() => setActiveStep(2)}
              type="button"
            >
              <span>2</span>
              <span>
                <strong>Signos vitales</strong>
                <small>Mediciones actuales</small>
              </span>
            </button>
            <span className={activeStep === 3 ? "preclinic-wizard-line completed" : "preclinic-wizard-line"} aria-hidden="true" />
            <button
              aria-label="Paso 3: Revisión y guardado"
              aria-current={activeStep === 3 ? "step" : undefined}
              className={activeStep === 3 ? "preclinic-wizard-step active" : "preclinic-wizard-step"}
              onClick={() => setActiveStep(3)}
              type="button"
            >
              <span>3</span>
              <span>
                <strong>Revisión</strong>
                <small>Confirmar y guardar</small>
              </span>
            </button>
          </nav>

          {activeStep === 1 ? (
            <section className="preclinic-step-panel" aria-labelledby="medical-step-title">
              <div className="vitals-form-intro medical-form-intro">
                <span className="vitals-form-intro-icon" aria-hidden="true">
                  <ClipboardList size={21} />
                </span>
                <div>
                  <strong id="medical-step-title">Información médica</strong>
                  <p>Complete los antecedentes que deben acompañar al paciente en cada consulta.</p>
                </div>
              </div>

              <div className="medical-profile-grid">
                <label className="medical-profile-field">
                  <span>Alergias conocidas</span>
                  <textarea
                    name="allergies"
                    onChange={onChange}
                    placeholder="Escriba una alergia por línea"
                    rows="4"
                    value={form.allergies}
                  />
                  <small>Puede separarlas con una nueva línea o una coma.</small>
                </label>

                <label className="medical-profile-field">
                  <span>Condiciones crónicas</span>
                  <textarea
                    name="chronic_conditions"
                    onChange={onChange}
                    placeholder="Escriba una condición por línea"
                    rows="4"
                    value={form.chronic_conditions}
                  />
                  <small>Incluya únicamente diagnósticos confirmados.</small>
                </label>

                <label className="medical-profile-field medical-blood-type">
                  <span>Tipo de sangre</span>
                  <SearchSelect name="blood_type" onChange={onChange} value={form.blood_type}>
                    <option value="">Sin especificar</option>
                    {BLOOD_TYPES.map((bloodType) => (
                      <option key={bloodType} value={bloodType}>{bloodType}</option>
                    ))}
                  </SearchSelect>
                  <small>Seleccione el grupo y factor Rh si están confirmados.</small>
                </label>

                <label className="medical-profile-field medical-clinical-notes">
                  <span>Notas clínicas</span>
                  <textarea
                    name="clinical_notes"
                    onChange={onChange}
                    placeholder="Observaciones relevantes para próximas consultas"
                    rows="4"
                    value={form.clinical_notes}
                  />
                  <small>Estas notas serán visibles en el expediente clínico.</small>
                </label>
              </div>
            </section>
          ) : null}

          {activeStep === 2 ? (
            <section className="preclinic-step-panel" aria-labelledby="vitals-step-title">
              <div className="vitals-form-intro">
                <span className="vitals-form-intro-icon" aria-hidden="true">
                  <HeartPulse size={21} />
                </span>
                <div>
                  <strong id="vitals-step-title">Signos vitales</strong>
                  <p>Registre los valores actuales. El dato anterior aparece debajo de cada campo.</p>
                </div>
              </div>

              <div className="vitals-grid">
                <fieldset className="vital-card vital-pressure-card vital-tone-primary">
                  <legend className="vital-card-heading">
                    <span className="vital-card-icon" aria-hidden="true">
                      <Activity size={19} />
                    </span>
                    <span>
                      <strong>Presión arterial</strong>
                      <small>Complete ambos valores de la lectura</small>
                    </span>
                  </legend>

                  <div className="vital-pressure-fields">
                    <VitalField
                      compact
                      disabled={!selectedRecord}
                      label="Sistólica"
                      name="blood_pressure_systolic"
                      onChange={onChange}
                      previous={comparison?.blood_pressure_systolic}
                      step="1"
                      unit="mmHg"
                      value={form.blood_pressure_systolic}
                    />
                    <VitalField
                      compact
                      disabled={!selectedRecord}
                      label="Diastólica"
                      name="blood_pressure_diastolic"
                      onChange={onChange}
                      previous={comparison?.blood_pressure_diastolic}
                      step="1"
                      unit="mmHg"
                      value={form.blood_pressure_diastolic}
                    />
                  </div>
                </fieldset>

                <VitalField
                  description="Saturación de oxígeno"
                  disabled={!selectedRecord}
                  helper="Sin comparación previa"
                  icon={Droplets}
                  label="Oxigenación"
                  max="100"
                  name="oxygen_saturation"
                  onChange={onChange}
                  tone="accent"
                  unit="%"
                  value={form.oxygen_saturation}
                />

                <VitalField
                  description="Temperatura corporal"
                  disabled={!selectedRecord}
                  helper="Sin comparación previa"
                  icon={Thermometer}
                  label="Temperatura"
                  name="temperature"
                  onChange={onChange}
                  tone="copper"
                  unit="°C"
                  value={form.temperature}
                />

                <VitalField
                  description="Peso actual"
                  disabled={!selectedRecord}
                  icon={Weight}
                  label="Peso"
                  name="weight_kg"
                  onChange={onChange}
                  previous={comparison?.weight_kg}
                  unit="kg"
                  value={form.weight_kg}
                />

                <VitalField
                  description={selectedRecord?.is_pediatric ? "Estatura pediátrica" : "Disponible sólo en pediatría"}
                  disabled={!selectedRecord?.is_pediatric}
                  helper={selectedRecord?.is_pediatric ? "Sin registro anterior" : "No aplica para esta especialidad"}
                  icon={Ruler}
                  label="Altura"
                  name="height_cm"
                  onChange={onChange}
                  previous={selectedRecord?.is_pediatric ? comparison?.height_cm : null}
                  tone="accent"
                  unit="cm"
                  value={form.height_cm}
                />
              </div>
            </section>
          ) : null}

          {activeStep === 3 ? (
            <section className="preclinic-step-panel" aria-labelledby="review-step-title">
              <div className="vitals-form-intro review-form-intro">
                <span className="vitals-form-intro-icon" aria-hidden="true">
                  <CheckCircle2 size={21} />
                </span>
                <div>
                  <strong id="review-step-title">Revise antes de guardar</strong>
                  <p>Confirme que los antecedentes y las mediciones pertenecen a este paciente.</p>
                </div>
              </div>

              <div className="preclinic-review-grid">
                <article className="preclinic-review-card">
                  <header>
                    <span>
                      <ClipboardList size={19} aria-hidden="true" />
                      Información médica
                    </span>
                    <button onClick={() => setActiveStep(1)} type="button">Editar</button>
                  </header>
                  <dl className="preclinic-review-details">
                    <div>
                      <dt>Alergias</dt>
                      <dd><PreviewList items={allergyItems} /></dd>
                    </div>
                    <div>
                      <dt>Condiciones crónicas</dt>
                      <dd><PreviewList items={chronicConditionItems} /></dd>
                    </div>
                    <div>
                      <dt>Tipo de sangre</dt>
                      <dd className={form.blood_type ? "" : "review-empty-value"}>{form.blood_type || "Sin registrar"}</dd>
                    </div>
                    <div className="review-detail-wide">
                      <dt>Notas clínicas</dt>
                      <dd className={clinicalNotes ? "review-notes" : "review-empty-value"}>
                        {clinicalNotes || "Sin registrar"}
                      </dd>
                    </div>
                  </dl>
                </article>

                <article className="preclinic-review-card">
                  <header>
                    <span>
                      <HeartPulse size={19} aria-hidden="true" />
                      Signos vitales
                    </span>
                    <button onClick={() => setActiveStep(2)} type="button">Editar</button>
                  </header>
                  <dl className="preclinic-review-vitals">
                    <div>
                      <dt>Presión arterial</dt>
                      <dd className={pressureValue === "Sin registrar" ? "review-empty-value" : ""}>{pressureValue}</dd>
                    </div>
                    <div>
                      <dt>Oxigenación</dt>
                      <dd className={hasRecordedValue(form.oxygen_saturation) ? "" : "review-empty-value"}>
                        {previewValue(form.oxygen_saturation, "%")}
                      </dd>
                    </div>
                    <div>
                      <dt>Temperatura</dt>
                      <dd className={hasRecordedValue(form.temperature) ? "" : "review-empty-value"}>
                        {previewValue(form.temperature, "°C")}
                      </dd>
                    </div>
                    <div>
                      <dt>Peso</dt>
                      <dd className={hasRecordedValue(form.weight_kg) ? "" : "review-empty-value"}>
                        {previewValue(form.weight_kg, "kg")}
                      </dd>
                    </div>
                    <div>
                      <dt>Altura</dt>
                      <dd className={hasRecordedValue(form.height_cm) ? "" : "review-empty-value"}>
                        {selectedRecord?.is_pediatric ? previewValue(form.height_cm, "cm") : "No aplica"}
                      </dd>
                    </div>
                  </dl>
                </article>
              </div>
            </section>
          ) : null}

          <div className="modal-actions preclinic-wizard-actions">
            {activeStep === 1 ? (
              <>
                <button className="secondary-action compact" onClick={onClose} type="button">
                  Cancelar
                </button>
                <button className="primary-action compact" disabled={!selectedRecord} type="submit">
                  Continuar
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </>
            ) : activeStep === 2 ? (
              <>
                <button className="secondary-action compact" onClick={() => setActiveStep(1)} type="button">
                  <ChevronLeft size={18} aria-hidden="true" />
                  Atrás
                </button>
                <button className="primary-action compact" disabled={!selectedRecord} type="submit">
                  Revisar datos
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <button className="secondary-action compact" onClick={() => setActiveStep(2)} type="button">
                  <ChevronLeft size={18} aria-hidden="true" />
                  Atrás
                </button>
                <button className="primary-action compact" disabled={!selectedRecord || isSaving || isFutureDate} type="submit">
                  <Save size={18} aria-hidden="true" />
                  {isSaving ? "Guardando" : "Guardar preclínica"}
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
