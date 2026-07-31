import { SlidersHorizontal, Star } from "lucide-react";

import { PageHeader } from "../../../shared/components/PageHeader";

const medicines = ["Cardiostat 10 mg", "Presionil Forte", "Metabalance XR", "Respira Plus"];

export function MedicineCatalog() {
  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <button className="secondary-action compact" type="button">
            <SlidersHorizontal size={18} aria-hidden="true" />
            Filtros
          </button>
        }
        eyebrow="Medicamentos"
        title="Catalogo personalizado"
      >
        Opciones frecuentes y productos disponibles para consulta.
      </PageHeader>

      <div className="catalog-grid">
        {medicines.map((medicine, index) => (
          <article className="medicine-card" key={medicine}>
            <button className={index === 0 ? "star-button selected" : "star-button"} type="button" aria-label="Marcar favorito">
              <Star size={18} aria-hidden="true" />
            </button>
            <strong>{medicine}</strong>
            <span>Principio activo</span>
            <small>{index < 2 ? "Favorito" : "Complementario"}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
