interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="pagination-button" aria-label="First page" disabled={disabled || currentPage === 1} onClick={() => onPageChange(1)}>«</button>
      <button type="button" className="pagination-button" aria-label="Previous page" disabled={disabled || currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>‹</button>
      {pages.map((pageNumber) => (
        <button
          type="button"
          key={pageNumber}
          className={`pagination-button${pageNumber === currentPage ? " pagination-button-active" : ""}`}
          aria-label={`Page ${pageNumber}`}
          aria-current={pageNumber === currentPage ? "page" : undefined}
          disabled={disabled}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}
      <button type="button" className="pagination-button" aria-label="Next page" disabled={disabled || currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>›</button>
      <button type="button" className="pagination-button" aria-label="Last page" disabled={disabled || currentPage === totalPages} onClick={() => onPageChange(totalPages)}>»</button>
    </nav>
  );
}
