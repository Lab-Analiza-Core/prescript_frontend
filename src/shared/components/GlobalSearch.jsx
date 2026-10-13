import { CalendarDays, FileText, LoaderCircle, Search, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { searchClinicalRecords } from "../../api/endpoints/search";
import { getCountryLocale } from "../utils/countryUtils";
import { toDateKey } from "../utils/calendarUtils";

const RESULT_GROUPS = [
  { key: "patients", label: "Pacientes", type: "patient", icon: UserRound },
  { key: "appointments", label: "Citas", type: "appointment", icon: CalendarDays },
  { key: "prescriptions", label: "Recetas", type: "prescription", icon: FileText },
];

function formatDateTime(value, locale) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeResults(payload, locale) {
  return RESULT_GROUPS.flatMap((group) =>
    (payload?.[group.key] || []).map((record) => {
      if (group.type === "patient") {
        return {
          ...record,
          key: `patient-${record.id}`,
          type: group.type,
          title: record.name,
          subtitle: record.dni ? `DNI ${record.dni}` : record.phone || "Sin identificación registrada",
          meta: record.doctor_name,
          destination: `/app/pacientes/${record.id}`,
        };
      }
      if (group.type === "appointment") {
        return {
          ...record,
          key: `appointment-${record.id}`,
          type: group.type,
          title: record.patient_name,
          subtitle: record.reason || "Consulta programada",
          meta: formatDateTime(record.scheduled_at, locale),
          destination: `/app/agenda?date=${toDateKey(new Date(record.scheduled_at))}`,
        };
      }
      return {
        ...record,
        key: `prescription-${record.id}`,
        type: group.type,
        title: record.patient_name,
        subtitle: record.diagnosis || "Sin diagnóstico registrado",
        meta: `Receta #${record.id} · ${formatDateTime(record.created_at, locale)}`,
        destination: `/app/pacientes/${record.patient_id}`,
      };
    }),
  );
}

export function GlobalSearch({ country, countryCode }) {
  const navigate = useNavigate();
  const locale = getCountryLocale(country);
  const listboxId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < 2) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage("");
      searchClinicalRecords(normalizedQuery, { signal: controller.signal })
        .then((payload) => {
          if (!controller.signal.aborted) {
            setResults(normalizeResults(payload, locale));
            setActiveIndex(-1);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResults([]);
            setErrorMessage("No se pudo completar la búsqueda.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [countryCode, locale, normalizedQuery]);

  const openResult = (result) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    navigate(result.destination);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowDown") {
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else {
      openResult(results[activeIndex >= 0 ? activeIndex : 0]);
    }
  };

  return (
    <div className="global-search" ref={rootRef}>
      <div className={isOpen ? "search-shell active" : "search-shell"}>
        <Search size={18} aria-hidden="true" />
        <input
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${results[activeIndex].key}` : undefined}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label="Buscar en Prescript"
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            if (nextQuery.trim().length < 2) {
              setResults([]);
              setErrorMessage("");
              setIsLoading(false);
              setActiveIndex(-1);
            } else {
              setResults([]);
              setErrorMessage("");
              setIsLoading(true);
              setActiveIndex(-1);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar paciente, cita o receta"
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />
        {isLoading ? <LoaderCircle className="search-loader" size={17} aria-label="Buscando" /> : <kbd>Ctrl K</kbd>}
      </div>

      {isOpen ? (
        <section className="search-results-popover" aria-label="Resultados de búsqueda">
          {normalizedQuery.length < 2 ? (
            <div className="search-guidance">
              <span className="search-guidance-icon"><Search size={18} aria-hidden="true" /></span>
              <div>
                <strong>Encuentra un registro clínico</strong>
                <span>Escribe nombre, DNI, teléfono, motivo o diagnóstico.</span>
              </div>
            </div>
          ) : null}

          {errorMessage ? <div className="search-empty-state">{errorMessage}</div> : null}
          {!isLoading && !errorMessage && normalizedQuery.length >= 2 && results.length === 0 ? (
            <div className="search-empty-state">No hay coincidencias para “{normalizedQuery}”.</div>
          ) : null}

          <div id={listboxId} role="listbox">
            {RESULT_GROUPS.map((group) => {
              const groupResults = results.filter((result) => result.type === group.type);
              if (!groupResults.length) return null;
              const Icon = group.icon;
              return (
                <div className="search-result-group" key={group.key}>
                  <div className="search-result-heading">
                    <Icon size={14} aria-hidden="true" />
                    <span>{group.label}</span>
                    <small>{groupResults.length}</small>
                  </div>
                  {groupResults.map((result) => {
                    const resultIndex = results.findIndex((item) => item.key === result.key);
                    return (
                      <button
                        aria-selected={resultIndex === activeIndex}
                        className={resultIndex === activeIndex ? `search-result ${result.type} active` : `search-result ${result.type}`}
                        id={`${listboxId}-${result.key}`}
                        key={result.key}
                        onClick={() => openResult(result)}
                        onMouseEnter={() => setActiveIndex(resultIndex)}
                        role="option"
                        type="button"
                      >
                        <span className="search-result-mark"><Icon size={16} aria-hidden="true" /></span>
                        <span className="search-result-copy">
                          <strong>{result.title}</strong>
                          <span>{result.subtitle}</span>
                        </span>
                        <small>{result.meta}</small>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {results.length ? (
            <footer className="search-results-footer">
              <span>{results.length} coincidencias</span>
              <span><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir</span>
            </footer>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
