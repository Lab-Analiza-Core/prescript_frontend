export const emptyVitals = {
  allergies: "",
  chronic_conditions: "",
  blood_type: "",
  clinical_notes: "",
  blood_pressure_systolic: "",
  blood_pressure_diastolic: "",
  oxygen_saturation: "",
  temperature: "",
  height_cm: "",
  weight_kg: "",
};

const toFormValue = (value) => (value === null || value === undefined ? "" : String(value));
const toMedicalListText = (value) => (Array.isArray(value) ? value.filter(Boolean).join("\n") : "");

export const medicalListFromText = (value) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const buildVitalsForm = (record) => {
  const current = record?.current_vitals || {};
  const comparison = record?.comparison_vitals || {};
  const medicalProfile = record?.medical_profile || {};
  return {
    allergies: toMedicalListText(medicalProfile.allergies),
    chronic_conditions: toMedicalListText(medicalProfile.chronic_conditions),
    blood_type: toFormValue(medicalProfile.blood_type),
    clinical_notes: toFormValue(medicalProfile.clinical_notes),
    blood_pressure_systolic: toFormValue(current.blood_pressure_systolic ?? comparison.blood_pressure_systolic),
    blood_pressure_diastolic: toFormValue(current.blood_pressure_diastolic ?? comparison.blood_pressure_diastolic),
    oxygen_saturation: toFormValue(current.oxygen_saturation),
    temperature: toFormValue(current.temperature),
    height_cm: record?.is_pediatric ? toFormValue(current.height_cm ?? comparison.height_cm) : "",
    weight_kg: toFormValue(current.weight_kg ?? comparison.weight_kg),
  };
};

export const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

export const formatTime = (value, locale = "es-HN") => {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
