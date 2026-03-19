import { useEffect } from "react";
import "../styles/pagination.css";

export default function Pagination({
    page = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20, 50],
    storageKey,
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        if (!storageKey) return;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const p = Number(saved);
            if (p > 0 && p <= totalPages && p !== page) {
                onPageChange(p);
            }
        }
    }, [storageKey, totalPages]);

    useEffect(() => {
        if (!storageKey) return;
        localStorage.setItem(storageKey, String(page));
    }, [storageKey, page]);

    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        const delta = 2;

        const start = Math.max(1, page - delta);
        const end = Math.min(totalPages, page + delta);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("...");
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = getPages();

    return (
        <div className="pagination-wrap pagination-scope">
            {onPageSizeChange && (
                <div className="pagination-size">
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((x) => (
                            <option key={x} value={x}>
                                {x} / trang
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="pagination">
                <button
                    type="button"
                    className="pagination-nav"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <span className="pagination-arrow">←</span>
                    <span>previous</span>
                </button>

                <div className="pagination-pages">
                    {pages.map((p, i) =>
                        p === "..." ? (
                            <span key={i} className="pagination-ellipsis">
                                ...
                            </span>
                        ) : (
                            <button
                                key={i}
                                type="button"
                                className={`pagination-page ${p === page ? "active" : ""}`}
                                onClick={() => onPageChange(p)}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                <button
                    type="button"
                    className="pagination-nav"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <span>next</span>
                    <span className="pagination-arrow">→</span>
                </button>
            </div>
        </div>
    );
}