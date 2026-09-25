import { parseGridViewTable, type GridViewResult } from './gridView';

/**
 * Shared fallback for report pages whose exact structure we could not
 * verify against a live TradingWorks session (Actual.aspx,
 * MyOvertimeRequisitions.aspx, ApproveManualAttendances.aspx,
 * ReportWFAllowances.aspx). Returns the raw header/row data so the options
 * page can render it as a plain table; a dedicated typed parser can
 * replace this once the real markup is confirmed.
 */
export function extractGenericReport(document: Document): GridViewResult {
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table'));
  for (const table of tables) {
    const result = parseGridViewTable(table);
    if (result.headers.length > 0) return result;
  }
  return { headers: [], rows: [] };
}
