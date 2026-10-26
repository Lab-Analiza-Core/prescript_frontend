import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

export function Pagination({ isLoading = false, onPageChange, page, pageSize = PAGE_SIZE, total }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Paginacion" className="pagination">
      <span className="pagination-summary">
        {first}-{last} de {total}
      </span>
      <div className="pagination-controls">
        <button
          aria-label="Pagina anterior"
          className="secondary-action compact"
          disabled={isLoading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft size={17} aria-hidden="true" />
          Anterior
        </button>
        <span className="pagination-page">
          Pagina {page} de {totalPages}
        </span>
        <button
          aria-label="Pagina siguiente"
          className="secondary-action compact"
          disabled={isLoading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Siguiente
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
