import { ShieldQuestion } from "lucide-react";

// Marca a los usuarios que se registraron por su cuenta, sin estar afiliados a Interactive Core.
export function ExternalBadge({ className = "" }) {
  return (
    <span
      className={`external-badge ${className}`.trim()}
      title="Cuenta registrada por la organizacion, no afiliada a Interactive Core"
    >
      <ShieldQuestion size={12} aria-hidden="true" />
      Externo
    </span>
  );
}
