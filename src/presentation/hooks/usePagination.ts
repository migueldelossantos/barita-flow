import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], itemsPerPage: number = 5) {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular el total de páginas de manera eficiente
  const totalPages = useMemo(() => {
    return Math.ceil(items.length / itemsPerPage);
  }, [items.length, itemsPerPage]);

  // Cortar el array original para extraer sólo los elementos de la página actual
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, currentPage, itemsPerPage]);

  // Asegurar que si los datos cambian y la página actual queda vacía, regrese a la 1
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return {
    currentPage,
    totalPages,
    currentData,
    setCurrentPage,
  };
}