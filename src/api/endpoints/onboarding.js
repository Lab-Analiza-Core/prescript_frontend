// Fachada compatible: onboarding se divide entre registro, catalogos,
// afiliaciones administrativas e historial del paciente.
export * from "../../modules/auth/services/registrationService";
export * from "../../shared/services/catalogService";
export * from "../../modules/affiliations/services/affiliationService";
export * from "../../modules/patientPortal/services/patientHistoryService";
