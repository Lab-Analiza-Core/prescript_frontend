import { Stethoscope } from "lucide-react";

// Maqueta con las variables del borrador: no toca el resto de la aplicacion.
export function ThemePreview({ colors, fontFamily, logo, ratio }) {
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
    <div className="theme-preview" style={style} aria-label="Vista previa del tema">
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
        <div className="theme-preview-card">
          <strong>Paciente Ejemplo</strong>
          <small>3 citas pendientes hoy</small>
          <p>
            <span style={{ color: "var(--pv-success)" }}>● Atendida</span>{" "}
            <span style={{ color: "var(--pv-warning)" }}>● Pendiente</span>{" "}
            <span style={{ color: "var(--pv-error)" }}>● Cancelada</span>
          </p>
          <a href="#vista-previa" onClick={(event) => event.preventDefault()}>
            Ver detalle →
          </a>
        </div>
        <div className="theme-preview-buttons">
          <span className="primary">Guardar</span>
          <span className="secondary">Cancelar</span>
          <span className="danger">Eliminar</span>
        </div>
        {ratio ? <small>Contraste del boton principal: {ratio}:1</small> : null}
      </div>
    </div>
  );
}
