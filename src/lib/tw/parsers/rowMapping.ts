import type { GridRow } from './gridView';

/**
 * TradingWorks' own pages are labeled in Portuguese regardless of what
 * locale our extension UI is set to, so column lookups try Portuguese
 * header slugs first and fall back to English/other variants we might
 * encounter.
 */
export function pickColumn(row: GridRow, candidates: string[]): string {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined) return row[candidate];
  }
  return '';
}
