/**
 * These pages render action-only columns (a per-row "Cancelar" link, an
 * unlabeled icon column, ...) that are meaningless in a generic read-only
 * table since there's no working control behind them here.
 */
export function isActionOnlyLabel(label: string): boolean {
  const normalized = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  return normalized === '' || ['cancelar', 'acao', 'link'].includes(normalized);
}

/**
 * Some TradingWorks GridViews repeat the same header label for two columns
 * (e.g. two "Colaborador" columns). `parseGridViewTable` already keeps both
 * as distinct keys (via a `__2` suffix) so no data is lost, but showing the
 * same label twice in a read-only table is just confusing, so we keep only
 * the first column for each label.
 */
export function dedupeReportColumns<T extends { label: string }>(columns: T[]): T[] {
  const seen = new Set<string>();
  return columns.filter((column) => {
    if (seen.has(column.label)) return false;
    seen.add(column.label);
    return true;
  });
}
