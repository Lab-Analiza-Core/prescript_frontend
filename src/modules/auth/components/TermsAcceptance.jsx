import { LoaderCircle } from "lucide-react";

export function TermsAcceptance({ accepted, onChange, state }) {
  if (state.status === "loading") {
    return (
      <div className="terms-state">
        <LoaderCircle className="spin-icon" size={16} aria-hidden="true" /> Cargando terminos
      </div>
    );
  }

  if (state.status !== "ready") {
    return (
      <p className="form-error" role="alert">
        {state.status === "missing"
          ? "Los terminos y condiciones aun no estan publicados. Contacte al administrador."
          : "No se pudieron cargar los terminos y condiciones. Recargue la pagina."}
      </p>
    );
  }

  return (
    <div className="terms-block">
      <div aria-label={`${state.terms.title}, version ${state.terms.version}`} className="terms-box" tabIndex={0}>
        <strong>
          {state.terms.title} <small>v{state.terms.version}</small>
        </strong>
        <p>{state.terms.content}</p>
      </div>
      <label className="terms-check">
        <input checked={accepted} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
        <span>He leido y acepto los terminos y condiciones.</span>
      </label>
    </div>
  );
}
