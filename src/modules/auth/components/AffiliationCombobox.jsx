import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";

import { searchAffiliation } from "../../../api/endpoints/onboarding";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;

// Combobox de busqueda: filtra fichas de Interactive Core (segun el rol) por nombre o identificador.
export function AffiliationCombobox({ onSelect, placeholder = "Nombre o documento", role }) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef(null);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!canSearch) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsLoading(true);
      setHasError(false);
      searchAffiliation(role, trimmed, { signal: controller.signal })
        .then((rows) => {
          setOptions(rows);
          setActiveIndex(rows.length ? 0 : -1);
          setIsOpen(true);
        })
        .catch((error) => {
          if (error.code === "ERR_CANCELED") return;
          setOptions([]);
          setHasError(true);
          setIsOpen(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, role, trimmed]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const choose = (option) => {
    setIsOpen(false);
    setQuery("");
    setOptions([]);
    onSelect(option);
  };

  const handleKeyDown = (event) => {
    if (!isOpen && event.key === "ArrowDown" && options.length) {
      setIsOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && isOpen && options[activeIndex]) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showList = isOpen && canSearch;

  return (
    <div className="combobox" ref={containerRef}>
      <div className="input-shell">
        <Search size={18} aria-hidden="true" />
        <input
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showList}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length < MIN_QUERY_LENGTH) {
              setOptions([]);
              setIsOpen(false);
            }
          }}
          onFocus={() => options.length && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        {isLoading ? <LoaderCircle className="spin-icon" size={16} aria-hidden="true" /> : null}
      </div>

      {showList ? (
        <ul className="combobox-list" id={listId} role="listbox">
          {options.map((option, index) => (
            <li
              aria-selected={index === activeIndex}
              className="combobox-option"
              id={`${listId}-${index}`}
              key={option.id}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
            >
              <strong>{option.full_name}</strong>
              <small>
                {[option.country_code, option.identifier_hint && `${option.identifier_label} ${option.identifier_hint}`]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </li>
          ))}
          {!options.length && !isLoading ? (
            <li className="combobox-empty" role="presentation">
              {hasError ? "No se pudo buscar. Intente de nuevo." : "Sin coincidencias en Interactive Core."}
            </li>
          ) : null}
        </ul>
      ) : (
        <small className="combobox-hint">
          {canSearch ? "" : `Escriba al menos ${MIN_QUERY_LENGTH} caracteres para buscar.`}
        </small>
      )}
    </div>
  );
}
