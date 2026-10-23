export const ROLE_LABELS = {
  DOCTOR: "Doctor",
  SECRETARY: "Secretaria",
  NURSE: "Enfermera",
  PATIENT: "Paciente",
  ORG_ADMIN: "Administrador de organizacion",
};

const roleOptions = (values) => values.map((value) => ({ value, label: ROLE_LABELS[value] }));

// El administrador de organizacion no puede invitar administradores; solo el global.
export const MEMBER_INVITE_ROLES = roleOptions(["DOCTOR", "SECRETARY", "NURSE", "PATIENT"]);
export const GLOBAL_INVITE_ROLES = roleOptions(["DOCTOR", "SECRETARY", "NURSE", "PATIENT", "ORG_ADMIN"]);

export const MEMBER_ROLE_FILTERS = roleOptions(["DOCTOR", "SECRETARY", "NURSE", "PATIENT", "ORG_ADMIN"]);

export const ORGANIZATION_STATUS_LABELS = {
  active: "Activa",
  suspended: "Suspendida",
};

export function getInvitationState(invitation, now = Date.now()) {
  if (!invitation.is_active) return { key: "revoked", label: "Revocada" };
  if (invitation.expires_at && new Date(invitation.expires_at).getTime() <= now) {
    return { key: "expired", label: "Vencida" };
  }
  if (invitation.max_uses !== null && invitation.uses >= invitation.max_uses) {
    return { key: "exhausted", label: "Agotada" };
  }
  return { key: "active", label: "Activa" };
}
