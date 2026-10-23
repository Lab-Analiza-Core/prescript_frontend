import { useState } from "react";
import { Building2, X } from "lucide-react";

import { listPublicDivisions, listPublicSpecialties } from "../../../api/endpoints/onboarding";
import { useApiResource } from "../../../shared/hooks/useApiResource";

const emptyForm = { name: "", country: "", division: "", medicalArea: "", status: "active" };

const toForm = (organization) =>
  organization
    ? {
        name: organization.name,
        country: String(organization.country),
        division: organization.division ? String(organization.division) : "",
        medicalArea: organization.medical_area ? String(organization.medical_area) : "",
        status: organization.status,
      }
    : emptyForm;

// La division y el area medica cambian segun el pais elegido; el pais no se edita despues de crear.
export function OrganizationFormModal({ countries, isSaving, onClose, onSubmit, organization }) {
  const isEditing = Boolean(organization);
  const [form, setForm] = useState(() => toForm(organization));
  const selectedCountry = countries.find((country) => String(country.id) === form.country);
  const countryCode = selectedCountry?.code || "";

  const divisions = useApiResource(
    () => (countryCode ? listPublicDivisions(countryCode) : Promise.resolve([])),
    `divisions-${countryCode}`,
  );
  const specialties = useApiResource(
    () => (countryCode ? listPublicSpecialties(countryCode) : Promise.resolve([])),
    `specialties-${countryCode}`,
  );
  const divisionOptions = divisions.data || [];
  const divisionLabel = divisionOptions[0]?.division_type || "Division";

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const changeCountry = (event) => {
    setForm((current) => ({ ...current, country: event.target.value, division: "", medicalArea: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      country: Number(form.country),
      division: form.division ? Number(form.division) : null,
      medical_area: form.medicalArea ? Number(form.medicalArea) : null,
      ...(isEditing ? { status: form.status } : {}),
    });
  };

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar formulario" />
      <section className="form-modal profile-modal user-modal" aria-labelledby="organization-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header user-modal-header">
          <div className="doctor-avatar">
            <Building2 size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Organizaciones</span>
            <h2 id="organization-modal-title">{isEditing ? "Editar organizacion" : "Nueva organizacion"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form user-form" id="organization-form" onSubmit={handleSubmit}>
          <label className="field-wide">
            <span>Nombre</span>
            <input maxLength={200} name="name" onChange={updateField} required value={form.name} />
          </label>

          <label>
            <span>Pais</span>
            <select disabled={isEditing} name="country" onChange={changeCountry} required value={form.country}>
              <option value="">Seleccione</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{divisionLabel}</span>
            <select disabled={!countryCode} name="division" onChange={updateField} value={form.division}>
              <option value="">Sin {divisionLabel.toLowerCase()}</option>
              {divisionOptions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-wide">
            <span>Area medica</span>
            <select disabled={!countryCode} name="medicalArea" onChange={updateField} value={form.medicalArea}>
              <option value="">Sin area medica</option>
              {(specialties.data || []).map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </label>

          {isEditing ? (
            <label className="field-wide">
              <span>Estado</span>
              <select name="status" onChange={updateField} value={form.status}>
                <option value="active">Activa</option>
                <option disabled={organization.is_interactive_core} value="suspended">
                  Suspendida (bloquea el ingreso de sus miembros)
                </option>
              </select>
            </label>
          ) : null}
        </form>

        <div className="modal-actions">
          <button className="secondary-action compact" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-action compact" disabled={isSaving} form="organization-form" type="submit">
            {isSaving ? "Guardando" : "Guardar"}
          </button>
        </div>
      </section>
    </div>
  );
}
