import { UserRound, X } from "lucide-react";
import { useState } from "react";

import { ROLE_OPTIONS } from "../userConstants";

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  roles: ["SECRETARY"],
  is_active: true,
  is_staff: false,
};

const getInitialForm = (user) =>
  user
    ? {
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        password: "",
        roles: user.roles?.length ? user.roles : [],
        is_active: Boolean(user.is_active),
        is_staff: Boolean(user.is_staff),
      }
    : emptyForm;

export function UserModal({ isSaving, mode, onClose, onSubmit, user }) {
  const [form, setForm] = useState(() => getInitialForm(user));
  const isEditing = mode === "edit";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleRole = (role) => {
    setForm((current) => {
      const roles = current.roles.includes(role) ? current.roles.filter((item) => item !== role) : [...current.roles, role];
      return { ...current, roles };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      username: form.username || form.email,
      roles: form.roles,
    };
    if (!payload.password) {
      delete payload.password;
    }
    onSubmit(payload);
  };

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cerrar gestion de usuario" />
      <section className="profile-modal user-modal" aria-labelledby="user-modal-title" role="dialog" aria-modal="true">
        <header className="modal-header user-modal-header">
          <div className="doctor-avatar">
            <UserRound size={22} aria-hidden="true" />
          </div>
          <div>
            <span className="eyebrow">Usuarios</span>
            <h2 id="user-modal-title">{isEditing ? "Editar usuario" : "Nuevo usuario"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form className="modal-form user-form" id="user-form" onSubmit={handleSubmit}>
          <label>
            <span>Nombre</span>
            <input value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
          </label>
          <label>
            <span>Apellido</span>
            <input value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
          </label>
          <label>
            <span>Correo</span>
            <input required type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </label>
          <label>
            <span>Usuario</span>
            <input value={form.username} onChange={(event) => updateField("username", event.target.value)} placeholder="Usa el correo si se deja vacio" />
          </label>
          <label className="field-wide">
            <span>{isEditing ? "Nueva contrasena" : "Contrasena temporal"}</span>
            <input
              autoComplete="new-password"
              minLength={8}
              required={!isEditing}
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          <div className="field-wide user-role-grid" role="group" aria-label="Roles de usuario">
            {ROLE_OPTIONS.map((option) => (
              <label className={form.roles.includes(option.value) ? "role-chip selected" : "role-chip"} key={option.value}>
                <input checked={form.roles.includes(option.value)} onChange={() => toggleRole(option.value)} type="checkbox" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <label className="user-toggle">
            <input checked={form.is_active} onChange={(event) => updateField("is_active", event.target.checked)} type="checkbox" />
            <span>Usuario activo</span>
          </label>
          <label className="user-toggle">
            <input checked={form.is_staff} onChange={(event) => updateField("is_staff", event.target.checked)} type="checkbox" />
            <span>Acceso staff Django</span>
          </label>
        </form>

        <div className="modal-actions">
          <button className="secondary-action compact" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="primary-action compact" disabled={isSaving} form="user-form" type="submit">
            {isSaving ? "Guardando" : "Guardar"}
          </button>
        </div>
      </section>
    </div>
  );
}
