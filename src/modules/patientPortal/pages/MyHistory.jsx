import { useState } from "react";
import { CalendarDays, FilePenLine, LoaderCircle, MailCheck, ShieldCheck, UserRound } from "lucide-react";

import { getPatientHistory, requestPatientHistoryCode, verifyPatientHistory } from "../../../api/endpoints/onboarding";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useAuth } from "../../../shared/context/useAuth";
import { useToast } from "../../../shared/context/useToast";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { getCountryLocale } from "../../../shared/utils/countryUtils";
import { useApiResource } from "../../../shared/hooks/useApiResource";

const STATUS_LABELS = {
  scheduled: "Programada",
  rescheduled: "Reprogramada",
  attended: "Atendida",
  cancelled: "Cancelada",
};

function LinkHistory({ onVerified }) {
  const { showToast } = useToast();
  const [codeRequested, setCodeRequested] = useState(false);
  const [code, setCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const requestCode = async () => {
    setIsBusy(true);
    try {
      const result = await requestPatientHistoryCode();
      setCodeRequested(true);
      showToast(result.detail, "success");
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo solicitar el codigo."), "error");
    } finally {
      setIsBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      showToast("Ingrese el codigo de 6 digitos.", "warning");
      return;
    }
    setIsBusy(true);
    try {
      await verifyPatientHistory(code.trim());
      showToast("Historial vinculado.", "success");
      await onVerified();
    } catch (error) {
      showToast(getApiErrorMessage(error, "No se pudo verificar el codigo."), "error");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="history-card link-history" aria-label="Vincular historial">
      <ShieldCheck size={26} aria-hidden="true" />
      <div>
        <h2>Vincule su historial</h2>
        <p>
          Para proteger su informacion clinica, enviaremos un codigo al correo que su doctor registro en su ficha. Si no
          reconoce ese correo, pida a su organizacion que lo actualice.
        </p>

        {!codeRequested ? (
          <button className="primary-action compact" disabled={isBusy} onClick={requestCode} type="button">
            {isBusy ? <LoaderCircle className="spin-icon" size={18} aria-hidden="true" /> : <MailCheck size={18} aria-hidden="true" />}
            Enviar codigo
          </button>
        ) : (
          <form className="inline-form" onSubmit={verify}>
            <div className="input-shell">
              <input
                autoComplete="one-time-code"
                className="code-input"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setCode(event.target.value)}
                placeholder="000000"
                value={code}
              />
            </div>
            <button className="primary-action compact" disabled={isBusy} type="submit">
              Verificar
            </button>
            <button className="secondary-action compact" disabled={isBusy} onClick={requestCode} type="button">
              Reenviar
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function HistorySection({ children, count, icon: Icon, title }) {
  return (
    <section className="history-card">
      <header className="history-card-header">
        <Icon size={18} aria-hidden="true" />
        <h2>{title}</h2>
        <span className="filter-count">{count}</span>
      </header>
      {count ? children : <div className="empty-state">Sin registros</div>}
    </section>
  );
}

export function MyHistory() {
  const { refreshUser, user } = useAuth();
  const isVerified = Boolean(user?.patientProfile?.history_verified);
  const locale = getCountryLocale(user?.country);
  const { data: history, error, isLoading, reload } = useApiResource(
    () => (isVerified ? getPatientHistory() : Promise.resolve(null)),
    `history-${isVerified}`,
  );

  const formatDate = (value) =>
    new Date(value).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Paciente" title="Mi historial">
        Sus fichas, citas y recetas registradas por sus doctores.
      </PageHeader>

      {!isVerified ? <LinkHistory onVerified={refreshUser} /> : null}

      {isVerified && isLoading && !history ? <div className="empty-state">Cargando historial</div> : null}

      {isVerified && error ? (
        <div className="empty-state">
          {getApiErrorMessage(error, "No se pudo cargar su historial.")}{" "}
          <button className="link-action" onClick={reload} type="button">
            Reintentar
          </button>
        </div>
      ) : null}

      {isVerified && history ? (
        <div className="history-grid">
          <HistorySection count={history.records.length} icon={UserRound} title="Fichas clinicas">
            {history.records.map((record) => (
              <article className="history-item" key={record.id}>
                <strong>
                  {record.first_name} {record.last_name}
                </strong>
                <small>{[record.doctor_name, record.organization].filter(Boolean).join(" · ")}</small>
              </article>
            ))}
          </HistorySection>

          <HistorySection count={history.appointments.length} icon={CalendarDays} title="Citas">
            {history.appointments.map((appointment) => (
              <article className="history-item" key={appointment.id}>
                <strong>{formatDate(appointment.scheduled_at)}</strong>
                <small>
                  {[appointment.doctor_name, appointment.reason].filter(Boolean).join(" · ")}
                </small>
                <span className="status-badge">{STATUS_LABELS[appointment.status] || appointment.status}</span>
              </article>
            ))}
          </HistorySection>

          <HistorySection count={history.prescriptions.length} icon={FilePenLine} title="Recetas">
            {history.prescriptions.map((prescription) => (
              <article className="history-item" key={prescription.id}>
                <strong>{formatDate(prescription.created_at)}</strong>
                <small>{[prescription.doctor_name, prescription.diagnosis].filter(Boolean).join(" · ")}</small>
                <ul className="history-items">
                  {prescription.items.map((item, index) => (
                    <li key={`${prescription.id}-${index}`}>
                      <strong>{item.medicine}</strong> — {item.dosage}, {item.frequency}, {item.duration}
                      {item.instructions ? <small>{item.instructions}</small> : null}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </HistorySection>
        </div>
      ) : null}
    </div>
  );
}
