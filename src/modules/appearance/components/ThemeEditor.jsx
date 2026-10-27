import { useEffect, useMemo, useRef, useState } from "react";
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
import { recommendPalettes } from "../../../shared/utils/palette";
import { applyTheme, contrastRatio, FONT_FAMILIES, fixContrast, isHexColor, normalizeHex } from "../../../shared/utils/theme";
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
  const [brandColor, setBrandColor] = useState(theme.colors.primary);
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

  // Las paletas se proponen al instante y se actualizan al cambiar el color de la marca.
  const palettes = useMemo(
    () => (isHexColor(brandColor) ? recommendPalettes(brandColor, options.min_contrast) : []),
    [brandColor, options.min_contrast],
  );

  const changedCount =
    options.tokens.filter(({ key }) => normalizeHex(colors[key]) !== normalizeHex(theme.colors[key])).length +
    (font !== theme.own.font ? 1 : 0);

  // Corrige solo el color del texto/elemento de cada par que no llega al contraste minimo.
  const fixTokens = (tokens) => {
    const next = { ...validColors };
    tokens.forEach((token) => {
      const backgrounds = options.contrast_pairs.filter((pair) => pair.text === token).map((pair) => next[pair.background]);
      next[token] = fixContrast(next[token], backgrounds, options.min_contrast);
    });
    setColors((current) => ({ ...current, ...Object.fromEntries(tokens.map((token) => [token, next[token]])) }));
    setFieldErrors({});
    showToast("Contraste corregido. Revise la vista previa y guarde.", "success");
  };

  const handleDiscard = () => {
    setColors(theme.colors);
    setFont(theme.own.font);
    setFieldErrors({});
  };

  // Aplica la paleta al borrador; no se guarda hasta pulsar "Guardar cambios".
  const applyPalette = (palette) => {
    setColors((current) => ({ ...current, ...palette.colors }));
    setFieldErrors({});
    showToast(`Paleta "${palette.name}" aplicada. Revise la vista previa y guarde.`, "success");
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

  // Con personalizacion guardada se pide confirmacion y se elimina; si solo hay un borrador sin guardar, se descarta.
  const handleResetClick = () => {
    if (theme.customized) {
      setIsConfirmingReset(true);
      return;
    }
    handleDiscard();
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
            <h2>{organization ? "Apariencia de la organizacion" : "Apariencia global"}</h2>
            <span>
              {theme.customized
                ? `Ultimo cambio${theme.updated_by ? ` de ${theme.updated_by}` : ""}${theme.updated_at ? ` el ${formatDate(theme.updated_at)}` : ""}.`
                : `Todavia no se ha personalizado: se usa ${parentLabel}.`}
            </span>
          </div>
          <span className={theme.customized ? "status-badge confirmed" : "status-badge pending"}>
            {theme.customized ? "Personalizada" : "Predeterminada"}
          </span>
        </header>

        <section className="theme-section">
          <h3>
            <span className="theme-step">1</span> Logo
          </h3>
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
          <small className="theme-hint">
            Aparece en el menu lateral y en el inicio de sesion. Use una imagen horizontal (PNG, JPG, WebP o SVG). El logo se guarda en cuanto lo sube.
          </small>
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
              <small className="theme-hint">Es el logo del tema global.</small>
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
        </section>

        <section className="theme-section">
          <h3>
            <span className="theme-step">2</span> Tipo de letra
          </h3>
          <label className="theme-font">
            <span>Letra de la aplicacion</span>
            <select onChange={(event) => setFont(event.target.value)} value={font}>
              <option value="">Usar la del tema global</option>
              {options.fonts.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <p style={{ fontFamily: FONT_FAMILIES[previewFont]?.stack }}>Calendario de citas · Receta medica 0123456789</p>
          </label>
        </section>

        <section className="theme-section">
          <h3>
            <span className="theme-step">3</span> Colores
          </h3>
          <small className="theme-hint">
            Elija el color principal de su marca y toque la combinacion que mas le guste. Todas se leen bien. Se ve en la vista previa y no se aplica
            hasta pulsar "Guardar cambios".
          </small>
          <div className="theme-brand">
            <span>Color principal de su marca</span>
            <div className="theme-token-input">
              <input
                aria-label="Color de marca: selector"
                onChange={(event) => setBrandColor(event.target.value)}
                type="color"
                value={(isHexColor(brandColor) ? normalizeHex(brandColor) : validColors.primary).toLowerCase()}
              />
              <input
                aria-invalid={!isHexColor(brandColor)}
                aria-label="Color de marca: valor hexadecimal"
                maxLength={7}
                onChange={(event) => setBrandColor(event.target.value)}
                value={brandColor}
              />
            </div>
          </div>
          {!isHexColor(brandColor) ? <small className="field-error">Use un color como #0F6B64.</small> : null}
          {palettes.length ? (
            <div className="theme-palettes">
              {palettes.map((palette) => (
                <button className="theme-palette" key={palette.key} onClick={() => applyPalette(palette)} type="button">
                  <span className="theme-palette-swatches" aria-hidden="true">
                    {["sidebar_bg", "primary", "accent", "background", "surface", "text"].map((token) => (
                      <i key={token} style={{ background: palette.colors[token] }} />
                    ))}
                  </span>
                  <strong>{palette.name}</strong>
                  <small>{palette.description}</small>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <details className="theme-section theme-advanced" open={failing.length > 0 || undefined}>
          <summary>
            <span className="theme-step">4</span> Ajustes avanzados <small className="theme-hint">(opcional)</small>
          </summary>
          <small className="theme-hint">Para cambiar un color en particular. Si ya eligio una combinacion arriba, no necesita tocar esto.</small>
          {TOKEN_GROUPS.map((group) => {
            const groupTokens = options.tokens.filter((token) => token.group === group.key);
            const badCount = groupTokens.filter((token) => ratios[token.key] !== undefined && ratios[token.key] < options.min_contrast).length;
            return (
              <details className="theme-group" key={group.key} open={badCount > 0 || undefined}>
                <summary>
                  <span>{group.title}</span>
                  <span className="theme-group-swatches" aria-hidden="true">
                    {groupTokens.map((token) => (
                      <i key={token.key} style={{ background: validColors[token.key] }} />
                    ))}
                  </span>
                  {badCount ? <em className="theme-ratio bad">Revisar {badCount}</em> : null}
                  {badCount ? (
                    <button
                      className="link-action"
                      onClick={(event) => {
                        event.preventDefault();
                        fixTokens(groupTokens.filter((token) => ratios[token.key] < options.min_contrast).map((token) => token.key));
                      }}
                      type="button"
                    >
                      Corregir
                    </button>
                  ) : null}
                </summary>
                <div className="theme-token-grid">
                  {groupTokens.map((token) => {
                    const isValid = isHexColor(colors[token.key]);
                    const ratio = ratios[token.key];
                    const isOk = ratio >= options.min_contrast;
                    const isInherited = normalizeHex(colors[token.key]) === normalizeHex(theme.inherited[token.key]);
                    return (
                      <div className="theme-token" key={token.key}>
                        <span className="theme-token-label">
                          {token.label}
                          {isInherited ? (
                            <small className="theme-inherited">Sin cambios</small>
                          ) : (
                            <button
                              className="link-action"
                              onClick={() => setColor(token.key, theme.inherited[token.key])}
                              title={`Volver al color de ${parentLabel}`}
                              type="button"
                            >
                              Restaurar
                            </button>
                          )}
                        </span>
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
                            <em className={isOk ? "theme-ratio ok" : "theme-ratio bad"} title={`Contraste ${ratio.toFixed(1)}:1 (minimo ${options.min_contrast}:1)`}>
                              {isOk ? "✓ Se lee bien" : "✕ Dificil de leer"}
                            </em>
                          ) : null}
                          {ratio !== undefined && isValid && !isOk ? (
                            <button className="link-action" onClick={() => fixTokens([token.key])} type="button">
                              Corregir
                            </button>
                          ) : null}
                        </div>
                        {!isValid ? <small className="field-error">Use un color como #0F6B64.</small> : null}
                        {fieldErrors[token.key] ? <small className="field-error">{fieldErrors[token.key]}</small> : null}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </details>
      </div>

      <aside className="theme-editor-side">
        <div className="theme-actions">
          <p className="theme-changes" aria-live="polite">
            {changedCount ? `${changedCount} ${changedCount === 1 ? "cambio" : "cambios"} sin guardar` : "No hay cambios por guardar"}
          </p>
          <button className="primary-action" disabled={!canSave} onClick={handleSave} type="button">
            {isSaving ? "Guardando" : "Guardar cambios"}
          </button>
          <button className="secondary-action" disabled={isSaving || !isDirty} onClick={handleDiscard} type="button">
            Descartar cambios
          </button>
          {failing.length ? (
            <>
              <p className="form-error">Hay colores dificiles de leer: corrijalos para poder guardar.</p>
              <button className="secondary-action" onClick={() => fixTokens(failing)} type="button">
                Corregir automaticamente
              </button>
            </>
          ) : null}
        </div>
        <h3>
          <Palette size={16} aria-hidden="true" /> Asi se vera
        </h3>
        <ThemePreview
          colors={validColors}
          fontFamily={FONT_FAMILIES[previewFont]?.stack}
          logo={theme.logo}
          ratio={ratios.button_primary_text ? contrastRatio(validColors.button_primary_text, validColors.button_primary_bg).toFixed(1) : null}
        />
        <label className="theme-live">
          <input checked={isLive} onChange={(event) => setIsLive(event.target.checked)} type="checkbox" />
          <span>Probar en toda la aplicacion (solo usted lo ve hasta que guarde)</span>
        </label>
        {theme.customized ? (
          <button className="link-action" disabled={isSaving} onClick={handleResetClick} type="button">
            {organization ? "Quitar personalizacion y usar el tema global" : "Volver a los colores del sistema"}
          </button>
        ) : null}
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
