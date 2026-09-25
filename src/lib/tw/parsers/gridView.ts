/**
 * TradingWorks renders almost every report as an ASP.NET GridView: a plain
 * <table> with a header row of <th> labels and one <tr> per data row. Rather
 * than write a bespoke parser per page, every report parser in this folder
 * locates its table and delegates to `parseGridViewTable`, which turns it
 * into an array of `{ [headerKey]: cellText }` rows keyed by a normalized
 * version of the header labels. Each header also keeps its original,
 * human-readable text (accents and casing intact) alongside that key, so
 * generic report rendering can display real labels instead of reconstructing
 * them from the slug.
 */

export function slugifyHeader(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * TradingWorks GridViews sometimes repeat the same header label for two
 * distinct columns (e.g. "Horas Totais" appearing twice). Slugifying both
 * to the same key would silently drop one column's data, so every repeat
 * past the first gets a deterministic `__2`, `__3`, ... suffix instead.
 */
function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header) => {
    const count = seen.get(header) ?? 0;
    seen.set(header, count + 1);
    return count === 0 ? header : `${header}__${count + 1}`;
  });
}

export type GridRow = Record<string, string>;

/** A header's normalized row key alongside its original display text. */
export interface GridHeader {
  key: string;
  label: string;
}

export interface GridViewResult {
  headers: GridHeader[];
  rows: GridRow[];
}

/** Parses a GridView-style <table> element into header key/label pairs + row objects. */
export function parseGridViewTable(table: HTMLTableElement | null): GridViewResult {
  if (!table) return { headers: [], rows: [] };

  const headerCells = Array.from(table.querySelectorAll('thead th, tr:first-child th'));
  const labels = headerCells.map((cell) => (cell.textContent ?? '').trim());
  const keys = dedupeHeaders(labels.map((label) => slugifyHeader(label)));
  if (keys.length === 0) return { headers: [], rows: [] };

  const headers: GridHeader[] = keys.map((key, index) => ({ key, label: labels[index] || key }));

  const bodyRows = Array.from(table.querySelectorAll('tbody tr')).filter(
    (row) => row.querySelectorAll('th').length === 0,
  );

  const rows: GridRow[] = bodyRows.map((row) => {
    const cells = Array.from(row.querySelectorAll('td'));
    const record: GridRow = {};
    keys.forEach((key, index) => {
      record[key] = (cells[index]?.textContent ?? '').trim();
    });
    return record;
  });

  return { headers, rows };
}

/** Finds a table by a `data-filename` attribute TradingWorks sets on some exported GridViews. */
export function findTableByFilename(document: Document, filename: string): HTMLTableElement | null {
  return document.querySelector<HTMLTableElement>(`table[data-filename="${filename}"]`);
}

/** Finds a table whose id ends with the given ASP.NET control id suffix. */
export function findTableById(document: Document, controlId: string): HTMLTableElement | null {
  return document.querySelector<HTMLTableElement>(`table[id$="${controlId}"]`);
}

/**
 * Finds a table by header content instead of id/class, for pages where
 * TradingWorks renders several tables and the one we need has no stable
 * selector. Matches the first table with a header cell whose slug equals
 * (or, with `partial`, contains) one of the given slugs.
 */
export function findTableByHeaderSlug(
  document: Document,
  slugs: string[],
  { partial = false }: { partial?: boolean } = {},
): HTMLTableElement | null {
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table'));
  return (
    tables.find((table) => {
      const headerCells = Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td'));
      const headerSlugs = headerCells.map((cell) => slugifyHeader(cell.textContent ?? ''));
      return slugs.some((slug) =>
        partial ? headerSlugs.some((header) => header.includes(slug)) : headerSlugs.includes(slug),
      );
    }) ?? null
  );
}
