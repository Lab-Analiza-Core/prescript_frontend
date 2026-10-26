import { Edit3, Filter, Globe2, KeyRound, MapPin, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createUser, deactivateUser, listUsers, resetUserPassword, updateUser } from "../services/userService";
import { PageHeader } from "../../../shared/components/PageHeader";
import { Pagination } from "../../../shared/components/Pagination";
import { useToast } from "../../../shared/context/useToast";
import { useAuth } from "../../../shared/context/useAuth";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { UserModal } from "../components/UserModal";
import { ROLE_OPTIONS, roleLabel } from "../userConstants";
import { SearchSelect } from "../../../shared/components/SearchSelect";

const getLoadErrorMessage = (error) => {
  if (error.response?.status === 403) {
    return "Tu acceso de administrador no esta vigente en InteractiveCore.";
  }
  if (error.response?.status === 503) {
    return "InteractiveCore no responde; no se pudo verificar el acceso. Intenta de nuevo en un momento.";
  }
  return "No se pudo cargar el modulo de usuarios.";
};

const toRows = (payload) => (Array.isArray(payload) ? payload : payload.results || []);
const toTotal = (payload) => (Array.isArray(payload) ? payload.length : payload.count ?? toRows(payload).length);

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

export function UserManagement() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
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

  const loadUsers = useCallback(async (nextFilters = filters, nextPage = page) => {
    setIsLoading(true);
    try {
      let payload;
      let resolvedPage = nextPage;
      try {
        payload = await listUsers({ ...nextFilters, page: nextPage });
      } catch (error) {
        // Pagina fuera de rango (p. ej. se quedo sin filas): se retrocede una.
        if (error.response?.status !== 404 || nextPage <= 1) throw error;
        resolvedPage = nextPage - 1;
        payload = await listUsers({ ...nextFilters, page: resolvedPage });
      }
      setPage(resolvedPage);
      setUsers(toRows(payload));
      setTotal(toTotal(payload));
    } catch (error) {
      showToast(getLoadErrorMessage(error), "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, showToast]);

  useEffect(() => {
    let isMounted = true;
    listUsers({ page: 1 })
      .then((payload) => {
        if (isMounted) {
          setUsers(toRows(payload));
      setTotal(toTotal(payload));
        }
      })
      .catch((error) => {
        if (isMounted) {
          showToast(getLoadErrorMessage(error), "error");
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
    loadUsers(nextFilters, 1);
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
    setIsSaving(true);
    try {
      const payload = await resetUserPassword(confirmState.user.id);
      showToast(`Contrasena temporal: ${payload.temporary_password}`, "success");
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
            <span>{total} registros</span>
          </div>
          <div className="user-control-actions">
            <div className="toolbar user-search">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label="Buscar usuario"
                onChange={(event) => updateFilter("search", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") loadUsers(filters, 1);
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
            <button className="secondary-action compact" onClick={() => loadUsers(filters, 1)} type="button">
              <Search size={17} aria-hidden="true" />
              Buscar
            </button>
          </div>
        </div>

        {showFilters ? (
          <div className="user-filters">
            <label>
              <span>Rol</span>
              <SearchSelect value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
                <option value="">Todos</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SearchSelect>
            </label>
            <label>
              <span>Estado</span>
              <SearchSelect value={filters.isActive} onChange={(event) => updateFilter("isActive", event.target.value)}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </SearchSelect>
            </label>
            <div className="user-filter-buttons">
              <button className="secondary-action compact" onClick={clearFilters} type="button">
                Limpiar
              </button>
              <button className="primary-action compact" onClick={() => loadUsers(filters, 1)} type="button">
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
            <span>Pais</span>
            <span>Acciones</span>
          </div>

          {isLoading ? <div className="empty-state">Cargando usuarios</div> : null}
          {!isLoading && users.length === 0 ? <div className="empty-state">Sin usuarios para mostrar</div> : null}

          {!isLoading &&
            users.map((user) => {
              const countryName = user.country?.name || user.profile?.country?.name;
              const name = user.full_name || user.username;
              const email = user.email || user.username;
              return (
              <article
                className={`table-row user-row role-${String(user.primary_role || "none").toLowerCase()}${user.is_active ? "" : " is-inactive"}`}
                key={user.id}
              >
                <div className="user-identity">
                  <span className="user-avatar">{getInitials(user)}</span>
                  <div>
                    <strong title={name}>{name}</strong>
                    <small title={email}>{email}</small>
                  </div>
                </div>
                <span className="role-badge">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {roleLabel(user.primary_role)}
                </span>
                <span className={user.is_active ? "user-status active" : "user-status"}>{user.is_active ? "Activo" : "Inactivo"}</span>
                <span className="user-country">
                  {countryName ? <MapPin size={14} aria-hidden="true" /> : <Globe2 size={14} aria-hidden="true" />}
                  {countryName || "Global"}
                </span>
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
              );
            })}
        </div>
        <Pagination isLoading={isLoading} onPageChange={(nextPage) => loadUsers(filters, nextPage)} page={page} total={total} />
      </div>

      {modalState.isOpen ? (
        <UserModal
          canSelectGlobal={Boolean(currentUser?.isGlobalAdmin)}
          countries={currentUser?.availableCountries || []}
          isSaving={isSaving}
          mode={modalState.mode}
          onClose={closeModal}
          onSubmit={saveUser}
          user={modalState.user}
        />
      ) : null}

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
