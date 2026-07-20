'use client';

/**
 * Reusable admin pagination.
 * Shows numbered pages with ellipsis so a 500+ product catalogue stays
 * navigable, and collapses to compact prev/next + "page x of y" on mobile.
 */
export default function Pagination({ page, total, pageSize, onChange, label = 'items' }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  if (pages <= 1) return null;

  const go = (p) => {
    const next = Math.min(Math.max(1, p), pages);
    if (next !== page) onChange(next);
  };

  // Window of page numbers around the current page, with first/last anchors.
  const nums = [];
  const push = (n) => { if (!nums.includes(n) && n >= 1 && n <= pages) nums.push(n); };
  push(1);
  for (let i = page - 1; i <= page + 1; i++) push(i);
  push(pages);
  nums.sort((a, b) => a - b);

  const withGaps = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) withGaps.push('gap-' + n);
    withGaps.push(n);
  });

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav className="admin-pagination" aria-label="Pagination">
      <button className="btn btn-sm" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page">
        ← <span className="pg-word">Prev</span>
      </button>

      <div className="pg-nums">
        {withGaps.map((n) =>
          typeof n === 'string' ? (
            <span key={n} className="pg-gap">…</span>
          ) : (
            <button
              key={n}
              className={`pg-num${n === page ? ' on' : ''}`}
              onClick={() => go(n)}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          )
        )}
      </div>

      <span className="pg-info">
        {from}–{to} of {total} {label}
      </span>

      <button className="btn btn-sm" onClick={() => go(page + 1)} disabled={page >= pages} aria-label="Next page">
        <span className="pg-word">Next</span> →
      </button>
    </nav>
  );
}
