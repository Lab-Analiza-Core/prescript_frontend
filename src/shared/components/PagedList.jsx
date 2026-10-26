import { usePagedRows } from "../hooks/usePagedResource";
import { Pagination } from "./Pagination";

// Muestra una lista ya cargada de 10 en 10. `resetKey` vuelve a la pagina 1 cuando cambia (p. ej. la fecha elegida).
export function PagedList({ items, renderItem, resetKey = "" }) {
  const paged = usePagedRows(items, resetKey);

  return (
    <>
      {paged.rows.map(renderItem)}
      <Pagination onPageChange={paged.setPage} page={paged.page} total={paged.total} />
    </>
  );
}
