import { Children, Fragment, isValidElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

// Convierte los <option> hijos (tambien dentro de fragmentos o listas) en opciones planas.
function collectOptions(children) {
  const options = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      options.push(...collectOptions(child.props.children));
    } else if (child.type === "option") {
      const label = Children.toArray(child.props.children).join("");
      options.push({
        disabled: Boolean(child.props.disabled),
        label,
        value: String(child.props.value ?? label),
      });
    }
  });
  return options;
}

/**
 * Reemplazo de <select> con el mismo uso: recibe <option> como hijos y llama a onChange con un
 * evento ({ target: { name, value } }), asi los manejadores existentes no cambian.
 * Muestra a lo sumo `maxResults` opciones; si hay mas, aparece un buscador para acotarlas.
 * La opcion de valor vacio (p. ej. "Todos") y las marcadas con isPinned quedan fijas arriba.
 * Con `options` ({ value, label, group, hint, isHintStrong, isPinned }) tambien admite grupos y notas.
 */
export function SearchSelect({
  "aria-label": ariaLabel,
  children,
  className = "",
  disabled = false,
  maxResults = 5,
  name,
  onChange,
  options: optionsProp,
  required = false,
  value = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  const options = optionsProp || collectOptions(children);
  const currentValue = String(value ?? "");
  const isPinned = (option) => option.isPinned || String(option.value) === "";
  const pinned = options.filter(isPinned);
  const rest = options.filter((option) => !isPinned(option));
  const hasSearch = rest.length > maxResults;
  const term = query.trim().toLowerCase();
  const matches = rest.filter(
    (option) =>
      !term || option.label.toLowerCase().includes(term) || (option.group || "").toLowerCase().includes(term),
  );
  const visible = hasSearch ? matches.slice(0, maxResults) : rest;
  const items = [...pinned, ...visible];
  const hiddenCount = hasSearch ? matches.length - visible.length : 0;
  const selected = options.find((option) => String(option.value) === currentValue);
  const active = Math.min(activeIndex, Math.max(items.length - 1, 0));

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = () => setIsOpen(false);
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) close();
    };
    // El panel va en un portal con posicion fija: al desplazar o redimensionar se cierra.
    const closeOnScroll = (event) => {
      if (!panelRef.current?.contains(event.target)) close();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  const open = () => {
    const rect = rootRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    // Si abajo no caben unos 300 px y arriba hay mas sitio, el panel se abre hacia arriba.
    const openUp = below < 300 && above > below;
    const space = openUp ? above : below;
    setPlacement({
      left: rect.left,
      maxHeight: Math.max(160, Math.min(space, 380)),
      width: Math.max(rect.width, 200),
      ...(openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
    setQuery("");
    setActiveIndex(Math.max(items.findIndex((option) => String(option.value) === currentValue), 0));
    setIsOpen(true);
  };

  const choose = (option) => {
    if (option && !option.disabled) onChange?.({ target: { name, value: String(option.value) } });
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" && !disabled) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.min(active + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(active - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[active]);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      setIsOpen(false);
    }
  };

  return (
    <div className={`search-select ${className}`.trim()} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="search-select-trigger"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="search-select-value">
          <strong>{selected?.label || "Seleccione"}</strong>
          {selected?.group ? <small>{selected.group}</small> : null}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {/* Permite que `required` bloquee el envio del formulario como en un <select>. */}
      {required ? (
        <input aria-hidden="true" className="search-select-required" onChange={() => {}} tabIndex={-1} value={currentValue} required />
      ) : null}

      {isOpen && placement
        ? createPortal(
        <div className="search-select-panel" ref={panelRef} style={placement}>
          {hasSearch ? (
            <label className="search-select-search">
              <Search size={15} aria-hidden="true" />
              <input
                aria-label="Buscar en la lista"
                autoFocus
                onChange={(event) => {
                  setQuery(event.target.value);
                  // Al escribir, Enter elige el primer resultado (las opciones fijas quedan antes).
                  setActiveIndex(event.target.value.trim() ? pinned.length : 0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar"
                value={query}
              />
            </label>
          ) : null}
          <ul className="search-select-list" role="listbox">
            {items.map((option, index) => {
              const heading = option.group && option.group !== items[index - 1]?.group ? option.group : null;
              return (
                <li key={`${option.value}-${index}`} role="presentation">
                  {heading ? <span className="search-select-group">{heading}</span> : null}
                  <button
                    aria-selected={String(option.value) === currentValue}
                    className={index === active ? "search-select-option active" : "search-select-option"}
                    disabled={option.disabled}
                    onClick={() => choose(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    <span>{option.label}</span>
                    {option.hint ? <small className={option.isHintStrong ? "is-strong" : ""}>{option.hint}</small> : null}
                  </button>
                </li>
              );
            })}
            {items.length === 0 ? <li className="search-select-empty">Sin resultados</li> : null}
          </ul>
          {hiddenCount > 0 ? (
            <p className="search-select-more">
              Mostrando {visible.length} de {matches.length}. Escriba para acotar la busqueda.
            </p>
          ) : null}
        </div>,
            document.body,
          )
        : null}
    </div>
  );
}
