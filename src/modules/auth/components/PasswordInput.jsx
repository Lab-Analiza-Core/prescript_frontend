import { Eye, EyeOff, Lock } from "lucide-react";

export function PasswordInput({
  isVisible,
  onToggleVisibility,
  revealLabel = "Mostrar contrasena",
  hideLabel = "Ocultar contrasena",
  ...inputProps
}) {
  const toggleLabel = isVisible ? hideLabel : revealLabel;
  const ToggleIcon = isVisible ? EyeOff : Eye;

  return (
    <div className="input-shell password-shell">
      <Lock size={18} aria-hidden="true" />
      <input {...inputProps} type={isVisible ? "text" : "password"} />
      <button
        aria-label={toggleLabel}
        aria-pressed={isVisible}
        className="password-toggle"
        onClick={onToggleVisibility}
        type="button"
      >
        <ToggleIcon size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
