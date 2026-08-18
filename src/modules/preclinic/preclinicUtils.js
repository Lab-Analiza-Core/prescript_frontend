export const emptyVitals = {
  blood_pressure_systolic: "",
  blood_pressure_diastolic: "",
  oxygen_saturation: "",
  temperature: "",
  height_cm: "",
  weight_kg: "",
};

const toFormValue = (value) => (value === null || value === undefined ? "" : String(value));

export const buildVitalsForm = (record) => {
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

export const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
};

export const formatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
