export const COUNTRY_LOCALES = {
  CR: "es-CR",
  GT: "es-GT",
  HN: "es-HN",
  SV: "es-SV",
};

export const getCountryCode = (country) => {
  if (country && typeof country === "object") {
    return String(country.code || "").trim().toUpperCase();
  }
  return String(country || "").trim().toUpperCase();
};

export const getCountryLocale = (country) => COUNTRY_LOCALES[getCountryCode(country)] || "es-HN";

export const getCountryName = (country) => {
  if (country && typeof country === "object") {
    return country.name || country.code || "Sin pais";
  }
  return country || "Sin pais";
};
