import { LoaderCircle } from "lucide-react";

export function LoadingTransition({ label = "Cargando" }) {
  return (
    <div className="loading-transition" role="status" aria-live="polite">
      <div className="loading-brand" aria-hidden="true">
        <span>P</span>
        <LoaderCircle size={22} />
      </div>
      <p>{label}</p>
    </div>
  );
}
