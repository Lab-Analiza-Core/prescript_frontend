import { useState } from "react";
import { Stethoscope } from "lucide-react";

const TABS = [
  ["agenda", "Agenda"],
  ["form", "Formulario"],
  ["states", "Estados"],
];

// Maqueta con las variables del borrador: no toca el resto de la aplicacion.
export function ThemePreview({ colors, fontFamily, logo, ratio }) {
  const [tab, setTab] = useState("agenda");
  const style = {
    "--pv-bg": colors.background,
    "--pv-surface": colors.surface,
    "--pv-text": colors.text,
    "--pv-muted": colors.text_secondary,
    "--pv-border": colors.border,
    "--pv-primary": colors.primary,
    "--pv-sidebar": colors.sidebar_bg,
    "--pv-sidebar-text": colors.sidebar_text,
    "--pv-active-bg": colors.sidebar_active_bg,
    "--pv-active-text": colors.sidebar_active_text,
    "--pv-btn": colors.button_primary_bg,
    "--pv-btn-text": colors.button_primary_text,
    "--pv-btn2": colors.button_secondary_bg,
    "--pv-btn2-text": colors.button_secondary_text,
    "--pv-danger": colors.button_danger_bg,
    "--pv-danger-text": colors.button_danger_text,
    "--pv-success": colors.success,
    "--pv-warning": colors.warning,
    "--pv-error": colors.error,
    fontFamily,
  };

  return (
    <div>
      <div className="theme-preview-tabs" role="tablist">
        {TABS.map(([key, label]) => (
          <button
            aria-selected={tab === key}
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="theme-preview"
        style={style}
        aria-label="Vista previa del tema"
      >
        <div className="theme-preview-side">
          {logo ? (
            <img alt="" src={logo} />
          ) : (
            <strong>
              <Stethoscope size={14} aria-hidden="true" /> Prescript
            </strong>
          )}
          <span>Agenda</span>
          <span className="active">Pacientes</span>
          <span>Recetas</span>
        </div>
        <div className="theme-preview-main">
          {tab === "form" ? (
            <>
              <div className="theme-preview-card">
                <strong>Nueva cita</strong>
                <small>Paciente</small>
                <span className="theme-preview-input">Paciente Ejemplo</span>
                <small>Motivo de consulta</small>
                <span className="theme-preview-input">Control general</span>
                <span className="theme-preview-error">
                  Falta indicar la hora.
                </span>
              </div>
              <div className="theme-preview-buttons">
                <span className="primary">Guardar</span>
                <span className="secondary">Cancelar</span>
              </div>
            </>
          ) : null}
          {tab === "states" ? (
            <div className="theme-preview-card">
              <strong>Mensajes</strong>
              <span
                className="theme-preview-alert"
                style={{ "--pv-tone": "var(--pv-success)" }}
              >
                ✓ Receta guardada
              </span>
              <span
                className="theme-preview-alert"
                style={{ "--pv-tone": "var(--pv-warning)" }}
              >
                ! Cita por confirmar
              </span>
              <span
                className="theme-preview-alert"
                style={{ "--pv-tone": "var(--pv-error)" }}
              >
                ✕ No se pudo enviar
              </span>
              <div className="theme-preview-buttons">
                <span className="danger">Eliminar</span>
              </div>
            </div>
          ) : null}
          {tab === "agenda" ? (
            <>
              <div className="theme-preview-card">
                <strong>Paciente Ejemplo</strong>
                <small>3 citas pendientes hoy</small>
                <p>
                  <span style={{ color: "var(--pv-success)" }}>● Atendida</span>{" "}
                  <span style={{ color: "var(--pv-warning)" }}>
                    ● Pendiente
                  </span>{" "}
                  <span style={{ color: "var(--pv-error)" }}>● Cancelada</span>
                </p>
                <a
                  href="#vista-previa"
                  onClick={(event) => event.preventDefault()}
                >
                  Ver detalle →
                </a>
              </div>
              <div className="theme-preview-buttons">
                <span className="primary">Guardar</span>
                <span className="secondary">Cancelar</span>
                <span className="danger">Eliminar</span>
              </div>
              {ratio ? (
                <small>
                  Texto del boton principal:{" "}
                  {Number(ratio) >= 4.5 ? "se lee bien" : "dificil de leer"}
                </small>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
