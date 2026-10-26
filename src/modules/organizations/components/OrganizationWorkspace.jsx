import { useState } from "react";
import { KeyRound, Link2, Palette, UsersRound } from "lucide-react";

import { ThemeEditor } from "../../appearance/components/ThemeEditor";
import { AssignmentsPanel } from "./AssignmentsPanel";
import { InvitationsPanel } from "./InvitationsPanel";
import { MembersPanel } from "./MembersPanel";
import { GLOBAL_INVITE_ROLES, MEMBER_INVITE_ROLES } from "../organizationConstants";

const TABS = [
  { key: "members", label: "Miembros", icon: UsersRound },
  { key: "invitations", label: "Invitaciones", icon: KeyRound },
  { key: "assignments", label: "Secretarias", icon: Link2 },
  { key: "appearance", label: "Apariencia", icon: Palette },
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
