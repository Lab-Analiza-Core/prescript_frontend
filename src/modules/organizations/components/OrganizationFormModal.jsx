import { useState } from "react";
import { Building2, Check, Search, X } from "lucide-react";

import { listPublicDivisions, listPublicSpecialties } from "../../../shared/services/catalogService";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const emptyForm = { name: "", country: "", division: "", medicalAreas: [], status: "active" };

const toForm = (organization) =>
  organization
    ? {
        name: organization.name,
        country: String(organization.country),
        division: organization.division ? String(organization.division) : "",
        medicalAreas: (
          organization.medical_areas || (organization.medical_area ? [organization.medical_area] : [])
        ).map(String),
        status: organization.status,
      }
    : emptyForm;

// La division y el area medica cambian segun el pais elegido; el pais no se edita despues de crear.
export function OrganizationFormModal({ countries, isSaving, onClose, onSubmit, organization }) {
  const isEditing = Boolean(organization);
  const [form, setForm] = useState(() => toForm(organization));
  const [medicalAreaQuery, setMedicalAreaQuery] = useState("");
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
  const specialtyOptions = specialties.data || [];
  const divisionLabel = divisionOptions[0]?.division_type || "Division";
  const normalizedMedicalAreaQuery = medicalAreaQuery.trim().toLowerCase();
  const filteredSpecialties = specialtyOptions.filter(
    (specialty) => !normalizedMedicalAreaQuery || specialty.name.toLowerCase().includes(normalizedMedicalAreaQuery),
  );
  const selectedSpecialties = specialtyOptions.filter((specialty) =>
    form.medicalAreas.includes(String(specialty.id)),
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const changeCountry = (event) => {
    setForm((current) => ({ ...current, country: event.target.value, division: "", medicalAreas: [] }));
    setMedicalAreaQuery("");
  };

  const toggleMedicalArea = (medicalAreaId) => {
    const value = String(medicalAreaId);
    setForm((current) => ({
      ...current,
      medicalAreas: current.medicalAreas.includes(value)
        ? current.medicalAreas.filter((id) => id !== value)
        : [...current.medicalAreas, value],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      country: Number(form.country),
      division: form.division ? Number(form.division) : null,
      medical_areas: form.medicalAreas.map(Number),
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
            <SearchSelect disabled={isEditing} name="country" onChange={changeCountry} required value={form.country}>
              <option value="">Seleccione</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </SearchSelect>
          </label>

          <label>
            <span>{divisionLabel}</span>
            <SearchSelect disabled={!countryCode} name="division" onChange={updateField} value={form.division}>
              <option value="">Sin {divisionLabel.toLowerCase()}</option>
              {divisionOptions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </SearchSelect>
          </label>

          <fieldset className="field-wide medical-area-field" disabled={!countryCode}>
            <legend>Areas medicas</legend>
            <div className="medical-area-selector">
              {selectedSpecialties.length > 0 ? (
                <div className="medical-area-selected" aria-label="Areas medicas seleccionadas">
                  {selectedSpecialties.map((specialty) => (
                    <button
                      aria-label={`Quitar ${specialty.name}`}
                      key={specialty.id}
                      onClick={() => toggleMedicalArea(specialty.id)}
                      type="button"
                    >
                      {specialty.name}
                      <X size={13} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : (
                <span className="medical-area-placeholder">
                  {countryCode ? "Ninguna area seleccionada" : "Seleccione primero un pais"}
                </span>
              )}

              {countryCode ? (
                <>
                  <label className="medical-area-search">
                    <Search size={15} aria-hidden="true" />
                    <input
                      aria-label="Buscar area medica"
                      onChange={(event) => setMedicalAreaQuery(event.target.value)}
                      placeholder="Buscar area medica"
                      type="search"
                      value={medicalAreaQuery}
                    />
                  </label>
                  <div className="medical-area-options" role="group" aria-label="Opciones de areas medicas">
                    {specialties.isLoading && !specialties.data ? <span>Cargando areas medicas</span> : null}
                    {specialties.error ? <span>No se pudieron cargar las areas medicas.</span> : null}
                    {!specialties.isLoading && !specialties.error && filteredSpecialties.length === 0 ? (
                      <span>Sin resultados</span>
                    ) : null}
                    {filteredSpecialties.map((specialty) => {
                      const isSelected = form.medicalAreas.includes(String(specialty.id));
                      return (
                        <label className={isSelected ? "medical-area-option selected" : "medical-area-option"} key={specialty.id}>
                          <input
                            checked={isSelected}
                            onChange={() => toggleMedicalArea(specialty.id)}
                            type="checkbox"
                            value={specialty.id}
                          />
                          <span>{specialty.name}</span>
                          {isSelected ? <Check size={15} aria-hidden="true" /> : null}
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
            <small>Puede seleccionar una o varias areas.</small>
          </fieldset>

          {isEditing ? (
            <label className="field-wide">
              <span>Estado</span>
              <SearchSelect name="status" onChange={updateField} value={form.status}>
                <option value="active">Activa</option>
                <option disabled={organization.is_interactive_core} value="suspended">
                  Suspendida (bloquea el ingreso de sus miembros)
                </option>
              </SearchSelect>
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
