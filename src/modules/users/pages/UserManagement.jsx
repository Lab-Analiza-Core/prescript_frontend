import { Edit3, Filter, KeyRound, Plus, Search, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createUser, deactivateUser, listUsers, resetUserPassword, updateUser } from "../../../api/endpoints/users";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useToast } from "../../../shared/context/useToast";

const ROLE_OPTIONS = [
  { label: "Administrador", value: "ADMIN" },
  { label: "Gerencia", value: "COUNTRY_MANAGER" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Enfermeria", value: "NURSE" },
  { label: "Secretaria", value: "SECRETARY" },
];

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

const roleLabel = (role) => ROLE_OPTIONS.find((option) => option.value === role)?.label || role || "Sin rol";

const getInitials = (user) => {
  const source = user.full_name || user.email || user.username || "U";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

function UserModal({ isSaving, mode, onClose, onSubmit, user }) {
  const [form, setForm] = useState(() =>
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
      : emptyForm,
  );

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

function ConfirmDialog({ isProcessing, message, onClose, onConfirm, title, variant = "danger" }) {
  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" onClick={onClose} type="button" aria-label="Cancelar" />
      <section className="profile-modal confirm-modal" aria-labelledby="user-confirm-title" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div className={variant === "danger" ? "doctor-avatar danger-avatar" : "doctor-avatar"}>
            {variant === "danger" ? <Trash2 size={22} aria-hidden="true" /> : <KeyRound size={22} aria-hidden="true" />}
          </div>
          <div>
            <span className={variant === "danger" ? "eyebrow danger-text" : "eyebrow"}>Confirmacion</span>
            <h2 id="user-confirm-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="secondary-action compact" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className={variant === "danger" ? "danger-action compact" : "primary-action compact"} disabled={isProcessing} onClick={onConfirm} type="button">
            {isProcessing ? "Procesando" : "Confirmar"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", role: "", isActive: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, mode: "create", user: null });
  const [confirmState, setConfirmState] = useState({ type: "", user: null });

  const activeFiltersCount = useMemo(
    () => [filters.search, filters.role, filters.isActive].filter((value) => String(value).trim()).length,
    [filters],
  );

  const loadUsers = useCallback(async (nextFilters = filters) => {
    setIsLoading(true);
    try {
      const payload = await listUsers(nextFilters);
      setUsers(Array.isArray(payload) ? payload : payload.results || []);
    } catch {
      showToast("No se pudo cargar el modulo de usuarios.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    let isMounted = true;
    listUsers()
      .then((payload) => {
        if (isMounted) {
          setUsers(Array.isArray(payload) ? payload : payload.results || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          showToast("No se pudo cargar el modulo de usuarios.", "error");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    const nextFilters = { search: "", role: "", isActive: "" };
    setFilters(nextFilters);
    loadUsers(nextFilters);
  };

  const openCreate = () => setModalState({ isOpen: true, mode: "create", user: null });
  const openEdit = (user) => setModalState({ isOpen: true, mode: "edit", user });
  const closeModal = () => setModalState((current) => ({ ...current, isOpen: false }));

  const saveUser = async (payload) => {
    setIsSaving(true);
    try {
      if (modalState.mode === "edit" && modalState.user) {
        await updateUser(modalState.user.id, payload);
        showToast("Usuario actualizado.", "success");
      } else {
        await createUser(payload);
        showToast("Usuario creado.", "success");
      }
      closeModal();
      await loadUsers();
    } catch (error) {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : "No se pudo guardar el usuario.";
      showToast(detail, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!confirmState.user) return;
    setIsSaving(true);
    try {
      await deactivateUser(confirmState.user.id);
      showToast("Usuario desactivado.", "success");
      setConfirmState({ type: "", user: null });
      await loadUsers();
    } catch {
      showToast("No se pudo desactivar el usuario.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmReset = async () => {
    if (!confirmState.user) return;
    const password = `Prescript${confirmState.user.id}!2026`;
    setIsSaving(true);
    try {
      await resetUserPassword(confirmState.user.id, password);
      showToast(`Contrasena temporal: ${password}`, "success");
      setConfirmState({ type: "", user: null });
    } catch {
      showToast("No se pudo resetear la contrasena.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-stack user-management-page">
      <PageHeader
        actions={
          <button className="primary-action compact" onClick={openCreate} type="button">
            <Plus size={18} aria-hidden="true" />
            Usuario
          </button>
        }
        eyebrow="Administracion"
        title="Gestion de usuarios"
      >
        Control de accesos, roles y estado operativo del portal.
      </PageHeader>

      <div className="user-control-panel">
        <div className="user-control-header">
          <div>
            <h2>Todos los usuarios</h2>
            <span>{users.length} registros</span>
          </div>
          <div className="user-control-actions">
            <div className="toolbar user-search">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label="Buscar usuario"
                onChange={(event) => updateFilter("search", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadUsers();
                }}
                placeholder="Nombre, correo o usuario"
                type="search"
                value={filters.search}
              />
            </div>
            <button className={showFilters || activeFiltersCount ? "secondary-action compact filter-active" : "secondary-action compact"} onClick={() => setShowFilters((value) => !value)} type="button">
              <Filter size={17} aria-hidden="true" />
              Filtros
              {activeFiltersCount ? <span className="filter-count">{activeFiltersCount}</span> : null}
            </button>
            <button className="secondary-action compact" onClick={() => loadUsers()} type="button">
              <Search size={17} aria-hidden="true" />
              Buscar
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="user-filters">
            <label>
              <span>Rol</span>
              <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
                <option value="">Todos</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Estado</span>
              <select value={filters.isActive} onChange={(event) => updateFilter("isActive", event.target.value)}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </label>
            <div className="user-filter-buttons">
              <button className="secondary-action compact" onClick={clearFilters} type="button">
                Limpiar
              </button>
              <button className="primary-action compact" onClick={() => loadUsers()} type="button">
                Aplicar
              </button>
            </div>
          </div>
        ) : null}

        <div className="user-table">
          <div className="table-row table-head user-row">
            <span>Usuario</span>
            <span>Rol</span>
            <span>Estado</span>
            <span>Perfil</span>
            <span>Acciones</span>
          </div>

          {isLoading ? <div className="empty-state">Cargando usuarios</div> : null}
          {!isLoading && users.length === 0 ? <div className="empty-state">Sin usuarios para mostrar</div> : null}

          {!isLoading &&
            users.map((user) => (
              <article className="table-row user-row" key={user.id}>
                <div className="user-identity">
                  <span className="user-avatar">{getInitials(user)}</span>
                  <div>
                    <strong>{user.full_name || user.username}</strong>
                    <small>{user.email || user.username}</small>
                  </div>
                </div>
                <span className="role-badge">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {roleLabel(user.primary_role)}
                </span>
                <span className={user.is_active ? "status-badge confirmed" : "status-badge cancelled"}>{user.is_active ? "Activo" : "Inactivo"}</span>
                <span>{user.profile?.type || "Interno"}</span>
                <div className="row-actions">
                  <button className="icon-button" onClick={() => openEdit(user)} type="button" aria-label="Editar usuario">
                    <Edit3 size={17} aria-hidden="true" />
                  </button>
                  <button className="icon-button" onClick={() => setConfirmState({ type: "reset", user })} type="button" aria-label="Resetear contrasena">
                    <KeyRound size={17} aria-hidden="true" />
                  </button>
                  <button className="icon-button danger-icon-button" onClick={() => setConfirmState({ type: "deactivate", user })} type="button" aria-label="Desactivar usuario">
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
        </div>
      </div>

      {modalState.isOpen ? <UserModal isSaving={isSaving} mode={modalState.mode} onClose={closeModal} onSubmit={saveUser} user={modalState.user} /> : null}

      {confirmState.type === "deactivate" ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={`Debe desactivarse ${confirmState.user?.full_name || confirmState.user?.username}?`}
          onClose={() => setConfirmState({ type: "", user: null })}
          onConfirm={confirmDeactivate}
          title="Desactivar usuario"
        />
      ) : null}

      {confirmState.type === "reset" ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={`Se asignara una contrasena temporal a ${confirmState.user?.full_name || confirmState.user?.username}.`}
          onClose={() => setConfirmState({ type: "", user: null })}
          onConfirm={confirmReset}
          title="Resetear contrasena"
          variant="primary"
        />
      ) : null}
    </div>
  );
}
