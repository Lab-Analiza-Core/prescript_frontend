import { useState } from "react";

import { PAGE_SIZE } from "../components/Pagination";
import { useApiResource } from "./useApiResource";

const toRows = (data) => (Array.isArray(data) ? data : data?.results || []);

// Listado paginado en el servidor (10 por pagina). `fetcher(page)` pide la pagina; `key` identifica
// los filtros: al cambiar vuelve a la pagina 1.
export function usePagedResource(fetcher, key = "") {
  const [state, setState] = useState({ key, page: 1 });
  if (state.key !== key) setState({ key, page: 1 });
  const page = state.key === key ? state.page : 1;

  const resource = useApiResource(async () => {
    try {
      return { page, payload: await fetcher(page) };
    } catch (error) {
      // Si la pagina quedo fuera de rango (se borro su ultima fila), se retrocede una.
      if (error.response?.status === 404 && page > 1) {
        return { page: page - 1, payload: await fetcher(page - 1) };
      }
      throw error;
    }
  }, `${key}|page-${page}`);

  const payload = resource.data?.payload;
  const rows = toRows(payload);
  return {
    data: resource.data ? rows : null,
    error: resource.error,
    isLoading: resource.isLoading,
    page: resource.data?.page ?? page,
    pageSize: PAGE_SIZE,
    reload: resource.reload,
    setPage: (nextPage) => setState({ key, page: nextPage }),
    total: Array.isArray(payload) ? rows.length : payload?.count ?? rows.length,
  };
}

// Paginacion en el cliente para listas que ya llegan completas (p. ej. filtradas por organizacion).
export function usePagedRows(rows, resetKey = "") {
  const [state, setState] = useState({ resetKey, page: 1 });
  if (state.resetKey !== resetKey) setState({ resetKey, page: 1 });
  const requestedPage = state.resetKey === resetKey ? state.page : 1;
  const setPage = (nextPage) => setState({ resetKey, page: nextPage });
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  return {
    page,
    rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    setPage,
    total: rows.length,
  };
}
