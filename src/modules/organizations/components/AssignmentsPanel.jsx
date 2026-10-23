import { useState } from "react";
import { Link2, Trash2 } from "lucide-react";

import {
  createSecretaryAssignment,
  deleteSecretaryAssignment,
  listMembers,
  listSecretaryAssignments,
} from "../../../api/endpoints/organizations";
import { useApiResource } from "../../../shared/hooks/useApiResource";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { ConfirmDialog } from "../../users/components/ConfirmDialog";

const COLUMNS = "1fr 1fr 70px";

// Las secretarias externas solo ven a los doctores que su organizacion les vincula aqui.
export function AssignmentsPanel({ organizationId }) {
  const { showToast } = useToast();
  const people = useApiResource(
    async () => {
      const [secretaries, doctors] = await Promise.all([
        listMembers({ organization: organizationId, role: "SECRETARY" }),
        listMembers({ organization: organizationId, role: "DOCTOR" }),
      ]);
      return { secretaries, doctors };
    },
    `assignment-people-${organizationId}`,
  );
  const assignments = useApiResource(listSecretaryAssignments, `assignments-${organizationId}`);
  const [form, setForm] = useState({ secretary: "", doctor: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const secretaries = people.data?.secretaries || [];
  const doctors = people.data?.doctors || [];
  // El listado de vinculos trae todos los permitidos; se acota a esta organizacion.
  const secretaryProfileIds = new Set(secretaries.map((member) => member.profile_id));
  const rows = (assignments.data || []).filter((row) => secretaryProfileIds.has(row.secretary));

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.secretary || !form.doctor) {
      showToast("Seleccione una secretaria y un doctor.", "warning");
      return;
    }
    setIsSaving(true);
    try {
      await createSecretaryAssignment({ secretary: Number(form.secretary), doctor: Number(form.doctor) });
      showToast("Vinculo creado.", "success");
      setForm({ secretary: form.secretary, doctor: "" });
      assignments.reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo crear el vinculo."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      await deleteSecretaryAssignment(toDelete.id);
      showToast("Vinculo eliminado.", "success");
      setToDelete(null);
      assignments.reload();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo eliminar el vinculo."), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel-stack">
      <form className="inline-form" onSubmit={handleCreate}>
        <label>
          <span>Secretaria</span>
          <select onChange={(event) => setForm({ ...form, secretary: event.target.value })} value={form.secretary}>
            <option value="">Seleccione</option>
            {secretaries.map((member) => (
              <option key={member.profile_id} value={member.profile_id}>
                {member.full_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Doctor</span>
          <select onChange={(event) => setForm({ ...form, doctor: event.target.value })} value={form.doctor}>
            <option value="">Seleccione</option>
            {doctors.map((member) => (
              <option key={member.profile_id} value={member.profile_id}>
                {member.full_name}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-action compact" disabled={isSaving} type="submit">
          <Link2 size={17} aria-hidden="true" />
          Vincular
        </button>
      </form>

      <div className="user-table">
        <div className="table-row table-head admin-row" style={{ "--cols": COLUMNS }}>
          <span>Secretaria</span>
          <span>Doctor</span>
          <span>Acciones</span>
        </div>

        {assignments.isLoading && !assignments.data ? <div className="empty-state">Cargando vinculos</div> : null}
        {assignments.data && rows.length === 0 ? <div className="empty-state">Sin vinculos registrados</div> : null}

        {rows.map((row) => (
          <article className="table-row admin-row" key={row.id} style={{ "--cols": COLUMNS }}>
            <strong>{row.secretary_name}</strong>
            <span>{row.doctor_name}</span>
            <div className="row-actions">
              <button className="icon-button danger-icon-button" onClick={() => setToDelete(row)} type="button" aria-label="Eliminar vinculo">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {toDelete ? (
        <ConfirmDialog
          isProcessing={isSaving}
          message={`${toDelete.secretary_name} dejara de ver los pacientes y citas de ${toDelete.doctor_name}.`}
          onClose={() => setToDelete(null)}
          onConfirm={confirmDelete}
          title="Eliminar vinculo"
        />
      ) : null}
    </div>
  );
}
