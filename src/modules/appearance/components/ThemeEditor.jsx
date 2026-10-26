import { useEffect, useRef, useState } from "react";
import { Check, Palette, Upload, X } from "lucide-react";

import {
  getTheme,
  getThemeOptions,
  removeThemeLogo,
  resetTheme,
  saveTheme,
  uploadThemeLogo,
} from "../../../shared/services/themeService";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { useTheme } from "../../../shared/context/useTheme";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage, getApiFieldErrors } from "../../../shared/utils/apiErrors";
import { applyTheme, contrastRatio, FONT_FAMILIES, isHexColor, normalizeHex } from "../../../shared/utils/theme";
import { ConfirmDialog } from "../../users/components/ConfirmDialog";
import { LOGO_TYPES, TOKEN_GROUPS } from "../themeGroups";
import { ThemePreview } from "./ThemePreview";

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "");

// Editor de apariencia: con `organization` edita esa organizacion; sin ella, el tema global.
export function ThemeEditor({ onSaved, organization = null }) {
  const organizationId = organization?.id ?? null;
  const options = useApiResource(getThemeOptions, "theme-options");
  const theme = useApiResource(() => getTheme(organizationId), `theme-${organizationId}`);

  if (options.error || theme.error) {
    return <div className="empty-state">{getApiErrorMessage(options.error || theme.error, "No se pudo cargar la apariencia.")}</div>;
  }
  if (!options.data || !theme.data || theme.isLoading) {
    return <div className="empty-state">Cargando apariencia</div>;
  }

  const { data } = theme;
  return (
    <ThemeEditorForm
      key={`${organizationId}|${data.updated_at}|${data.customized}`}
      onSaved={() => {
        theme.reload();
        onSaved?.();
      }}
      options={options.data}
      organization={organization}
      theme={data}
    />
  );
}

function ThemeEditorForm({ onSaved, options, organization, theme }) {
  const { showToast } = useToast();
  const { reloadTheme, theme: appTheme } = useTheme();
  const organizationId = organization?.id ?? null;
  const [colors, setColors] = useState(theme.colors);
  const [font, setFont] = useState(theme.own.font);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [logoSize, setLogoSize] = useState(null);
  const fileInput = useRef(null);

  const validColors = Object.fromEntries(
    Object.entries(colors).map(([token, value]) => [token, isHexColor(value) ? normalizeHex(value) : theme.colors[token]]),
  );
  const hasInvalidHex = Object.values(colors).some((value) => !isHexColor(value));
  const previewFont = font === theme.own.font ? theme.font : font;

  const ratios = {};
  options.contrast_pairs.forEach(({ text, background }) => {
    const ratio = contrastRatio(validColors[text], validColors[background]);
    ratios[text] = Math.min(ratios[text] ?? Infinity, ratio);
  });
  const failing = Object.keys(ratios).filter((token) => ratios[token] < options.min_contrast);

  const isDirty =
    font !== theme.own.font ||
    options.tokens.some(({ key }) => normalizeHex(colors[key]) !== normalizeHex(theme.colors[key]));
  const canSave = isDirty && !hasInvalidHex && failing.length === 0 && !isSaving;

  // Muestra el borrador en toda la aplicacion; al desmarcar o salir vuelve al tema vigente.
  useEffect(() => {
    if (!isLive) return undefined;
    applyTheme({ colors: validColors, font: previewFont });
    return () => applyTheme(appTheme || { colors: {} });
  });

  const setColor = (token, value) => {
    setColors((current) => ({ ...current, [token]: value }));
    setFieldErrors((current) => ({ ...current, [token]: "" }));
  };

  const finish = async (message) => {
    showToast(message, "success");
    // El usuario puede estar editando el tema que el mismo ve; se refresca la aplicacion.
    reloadTheme().catch(() => {});
    onSaved();
  };

  const handleSave = async () => {
    const own = {};
    options.tokens.forEach(({ key }) => {
      if (normalizeHex(colors[key]) !== normalizeHex(theme.inherited[key])) own[key] = normalizeHex(colors[key]);
    });
    setIsSaving(true);
    try {
      await saveTheme(organizationId, { colors: own, font });
      await finish("Apariencia guardada.");
    } catch (error) {
      setFieldErrors(getApiFieldErrors({ response: { data: error?.response?.data?.colors } }));
      showToast(getApiErrorMessage(error, "No se pudo guardar la apariencia."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetTheme(organizationId);
      setIsConfirmingReset(false);
      await finish(organization ? "Se restablecio el tema global." : "Se restablecieron los colores del sistema.");
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo restablecer."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      showToast("Formato no permitido. Use PNG, JPEG, WebP o SVG.", "warning");
      return;
    }
    if (file.size > options.max_logo_bytes) {
      showToast(`El logo no puede superar ${Math.round(options.max_logo_bytes / 1024)} KB.`, "warning");
      return;
    }
    setIsSaving(true);
    try {
      await uploadThemeLogo(organizationId, file);
      await finish("Logo actualizado.");
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo subir el logo."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoRemove = async () => {
    setIsSaving(true);
    try {
      await removeThemeLogo(organizationId);
      await finish("Logo quitado.");
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo quitar el logo."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const logoChecks = logoSize
    ? [
        [logoSize.width / logoSize.height >= 2, "Proporcion horizontal: aprovecha bien la barra."],
        [logoSize.height >= 88, "Resolucion suficiente para verse nitido."],
      ]
    : [];
  const parentLabel = organization ? "el tema global" : "los colores del sistema";

  return (
    <div className="theme-editor">
      <div className="theme-editor-main">
        <header className="theme-status">
          <div>
            <h2>{organization ? organization.name : "Tema global"}</h2>
            <span>
              {theme.customized
                ? `Personalizada${theme.updated_by ? ` · ${theme.updated_by}` : ""}${theme.updated_at ? ` · ${formatDate(theme.updated_at)}` : ""}`
                : `Sin personalizar: usa ${parentLabel}.`}
            </span>
          </div>
          <span className={theme.customized ? "status-badge confirmed" : "status-badge pending"}>
            {theme.customized ? "Personalizada" : "Heredada"}
          </span>
        </header>

        <section className="theme-section">
          <h3>Logo y fuente</h3>
          <div className="theme-logo-bar" style={{ background: validColors.sidebar_bg }}>
            {theme.logo ? (
              <img
                alt="Logo actual"
                onLoad={(event) => setLogoSize({ height: event.target.naturalHeight, width: event.target.naturalWidth })}
                src={theme.logo}
              />
            ) : (
              <span style={{ color: validColors.sidebar_text }}>Sin logo: se muestra el nombre de Prescript.</span>
            )}
          </div>
          <small className="theme-hint">Se muestra en el menu lateral y en el inicio de sesion (hasta unos 205 x 44 px).</small>
          <div className="theme-logo-actions">
            <input accept={LOGO_TYPES.join(",")} hidden onChange={handleLogoFile} ref={fileInput} type="file" />
            <button className="secondary-action compact" disabled={isSaving} onClick={() => fileInput.current?.click()} type="button">
              <Upload size={16} aria-hidden="true" />
              {theme.logo ? "Cambiar logo" : "Subir logo"}
            </button>
            {theme.own.has_logo ? (
              <button className="link-action" disabled={isSaving} onClick={handleLogoRemove} type="button">
                Quitar logo
              </button>
            ) : theme.logo ? (
              <small className="theme-hint">Heredado del tema global.</small>
            ) : null}
          </div>
          {logoChecks.length ? (
            <ul className="theme-checks">
              {logoChecks.map(([isOk, text]) => (
                <li className={isOk ? "ok" : "warn"} key={text}>
                  {isOk ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                  {text}
                </li>
              ))}
            </ul>
          ) : null}
          <label className="theme-font">
            <span>Fuente</span>
            <select onChange={(event) => setFont(event.target.value)} value={font}>
              <option value="">Heredada</option>
              {options.fonts.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <p style={{ fontFamily: FONT_FAMILIES[previewFont]?.stack }}>Calendario de citas · Receta medica 0123456789</p>
          </label>
        </section>

        {TOKEN_GROUPS.map((group) => (
          <section className="theme-section" key={group.key}>
            <h3>{group.title}</h3>
            <div className="theme-token-grid">
              {options.tokens
                .filter((token) => token.group === group.key)
                .map((token) => {
                  const isValid = isHexColor(colors[token.key]);
                  const ratio = ratios[token.key];
                  return (
                    <div className="theme-token" key={token.key}>
                      <span>{token.label}</span>
                      <div className="theme-token-input">
                        <input
                          aria-label={`${token.label}: selector`}
                          onChange={(event) => setColor(token.key, event.target.value)}
                          type="color"
                          value={validColors[token.key].toLowerCase()}
                        />
                        <input
                          aria-invalid={!isValid}
                          aria-label={`${token.label}: valor hexadecimal`}
                          maxLength={7}
                          onChange={(event) => setColor(token.key, event.target.value)}
                          value={colors[token.key]}
                        />
                        {ratio !== undefined && isValid ? (
                          <em className={ratio >= options.min_contrast ? "theme-ratio ok" : "theme-ratio bad"}>
                            {ratio >= options.min_contrast ? "✓" : "✕"} {ratio.toFixed(1)}:1
                          </em>
                        ) : null}
                      </div>
                      {!isValid ? <small className="field-error">Use un color como #0F6B64.</small> : null}
                      {fieldErrors[token.key] ? <small className="field-error">{fieldErrors[token.key]}</small> : null}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      <aside className="theme-editor-side">
        <h3>
          <Palette size={16} aria-hidden="true" /> Vista previa
        </h3>
        <ThemePreview
          colors={validColors}
          fontFamily={FONT_FAMILIES[previewFont]?.stack}
          logo={theme.logo}
          ratio={ratios.button_primary_text ? contrastRatio(validColors.button_primary_text, validColors.button_primary_bg).toFixed(1) : null}
        />
        <label className="theme-live">
          <input checked={isLive} onChange={(event) => setIsLive(event.target.checked)} type="checkbox" />
          <span>Ver los cambios en toda la aplicacion antes de guardar</span>
        </label>
        {failing.length ? (
          <p className="form-error">Corrija el contraste (minimo {options.min_contrast}:1) para poder guardar.</p>
        ) : null}
        <button className="primary-action" disabled={!canSave} onClick={handleSave} type="button">
          {isSaving ? "Guardando" : isDirty ? "Guardar cambios" : "Sin cambios"}
        </button>
        <button className="secondary-action danger-text" disabled={isSaving || !theme.customized} onClick={() => setIsConfirmingReset(true)} type="button">
          {organization ? "Volver al tema global" : "Volver a los colores del sistema"}
        </button>
      </aside>

      {isConfirmingReset ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={`Se eliminara la personalizacion de ${organization ? organization.name : "la aplicacion"} (colores, fuente y logo) y volvera a usar ${parentLabel}.`}
          onClose={() => setIsConfirmingReset(false)}
          onConfirm={handleReset}
          title="Restablecer apariencia"
        />
      ) : null}
    </div>
  );
}
