export const COUNTRY_FIELD_FORMATS = {
  HN: {
    dniMask: "9999-9999-99999",
    phoneMask: "9999-9999",
    phoneCode: "+504",
  },
  GT: {
    dniMask: "9999-99999-9999",
    phoneMask: "9999-9999",
    phoneCode: "+502",
  },
  CR: {
    dniMask: "9-9999-9999",
    phoneMask: "9999-9999",
    phoneCode: "+506",
  },
  SV: {
    dniMask: "",
    phoneMask: "9999-9999",
    phoneCode: "+503",
  },
};

export const getCountryFieldFormat = (country) => {
  const countryCode = String(country || "HN").trim().toUpperCase();
  return COUNTRY_FIELD_FORMATS[countryCode] || COUNTRY_FIELD_FORMATS.HN;
};

export const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

export const applyNumericMask = (value, mask = "") => {
  const digits = digitsOnly(value);
  if (!mask) return digits;

  let result = "";
  let digitIndex = 0;
  for (const character of mask) {
    if (character === "9" || character === "#" || character.toLowerCase() === "x") {
      if (digitIndex >= digits.length) break;
      result += digits[digitIndex];
      digitIndex += 1;
    } else if (digitIndex > 0 && digitIndex < digits.length) {
      result += character;
    }
  }
  return result;
};

export const maskPlaceholder = (mask = "") => mask.replace(/[9x#]/gi, "X");

export const stripPhoneCountryCode = (value, phoneCode) => {
  const digits = digitsOnly(value);
  const codeDigits = digitsOnly(phoneCode);
  return codeDigits && digits.startsWith(codeDigits) ? digits.slice(codeDigits.length) : digits;
};

export const isMaskComplete = (value, mask = "") => {
  const requiredDigits = (mask.match(/[9x#]/gi) || []).length;
  return requiredDigits === 0 || digitsOnly(value).length === requiredDigits;
};
