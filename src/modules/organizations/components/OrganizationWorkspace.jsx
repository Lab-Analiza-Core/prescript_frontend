import { useState } from "react";
import { KeyRound, Link2, Palette, UsersRound } from "lucide-react";

import { ThemeEditor } from "../../appearance/components/ThemeEditor";
import { AssignmentsPanel } from "./AssignmentsPanel";
import { InvitationsPanel } from "./InvitationsPanel";
import { MembersPanel } from "./MembersPanel";
import { GLOBAL_INVITE_ROLES, MEMBER_INVITE_ROLES } from "../organizationConstants";

const TABS = [
  { key: "members", label: "Miembros", icon: UsersRound, help: "Personas que ya forman parte de la organizacion. Puede desactivar o reactivar su acceso." },
  { key: "invitations", label: "Invitaciones", icon: KeyRound, help: "Cree un codigo y compartalo con quien debe registrarse en esta organizacion." },
  { key: "assignments", label: "Secretarias", icon: Link2, help: "Elija que doctores atiende cada secretaria. Ella solo vera los pacientes y citas de esos doctores." },
  { key: "appearance", label: "Apariencia", icon: Palette, help: "Logo, letra y colores que veran los usuarios de esta organizacion." },
];

// Gestion de una organizacion: la usan el administrador de organizacion (la suya) y el global (cualquiera).
export function OrganizationWorkspace({ isGlobal = false, organization }) {
  const [tab, setTab] = useState("members");

  return (
    <div className="workspace-panel">
      <div className="admin-tabs" role="tablist" aria-label={`Gestion de ${organization.name}`}>
        {TABS.map(({ icon: Icon, key, label }) => (
          <button
            aria-selected={tab === key}
            className={tab === key ? "admin-tab active" : "admin-tab"}
            key={key}
            onClick={() => setTab(key)}
            role="tab"
            type="button"
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <p className="theme-hint workspace-help">{TABS.find(({ key }) => key === tab).help}</p>

      {tab === "members" ? <MembersPanel canManageAdmins={isGlobal} organizationId={organization.id} /> : null}
      {tab === "invitations" ? (
        <InvitationsPanel
          allowedRoles={isGlobal ? GLOBAL_INVITE_ROLES : MEMBER_INVITE_ROLES}
          organization={organization}
        />
      ) : null}
      {tab === "assignments" ? <AssignmentsPanel organizationId={organization.id} /> : null}
      {tab === "appearance" ? <ThemeEditor organization={organization} /> : null}
    </div>
  );
}
