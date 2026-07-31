import { FilePlus2, Send } from "lucide-react";

import { PageHeader } from "../../../shared/components/PageHeader";

export function PrescriptionEditor() {
  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <button className="primary-action compact" type="button">
            <Send size={18} aria-hidden="true" />
            Enviar
          </button>
        }
        eyebrow="Recetas"
        title="Receta digital"
      >
        Indicaciones listas para revisar, firmar y compartir.
      </PageHeader>

      <div className="editor-shell">
        <div className="prescription-paper">
          <h2>Indicaciones</h2>
          <p>Agregue productos y complete las indicaciones antes de emitir.</p>
        </div>
        <button className="secondary-action" type="button">
          <FilePlus2 size={18} aria-hidden="true" />
          Agregar medicamento
        </button>
      </div>
    </div>
  );
}
