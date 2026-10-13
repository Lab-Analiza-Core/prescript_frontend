export const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const today = () => toDateKey(new Date());

export const toMonthAnchor = (dateKey) => {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
};

export const moveMonth = (dateKey, offset) => {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + offset, 1));
};

export const getMonthRange = (dateKey) => {
  const date = parseDateKey(dateKey);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    first: toDateKey(first),
    last: toDateKey(last),
  };
};

export const getMonthLabel = (dateKey, locale = "es-HN") =>
  new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(parseDateKey(dateKey));

export const getCalendarDays = (dateKey) => {
  const date = parseDateKey(dateKey);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const leadingDays = (first.getDay() + 6) % 7;
  const days = [];

  for (let index = 0; index < leadingDays; index += 1) {
    days.push({ key: `empty-${index}`, isEmpty: true });
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const current = new Date(date.getFullYear(), date.getMonth(), day);
    days.push({
      key: toDateKey(current),
      dateKey: toDateKey(current),
      day,
    });
  }

  return days;
};
