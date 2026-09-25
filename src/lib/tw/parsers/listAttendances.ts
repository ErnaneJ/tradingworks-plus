import { parseSignedBalance, timeToMinutes } from '../../domain/time';
import { findTableByFilename, parseGridViewTable } from './gridView';
import { pickColumn } from './rowMapping';
import type { AttendanceHistoryRow } from '../../storage/schema';

/** Table selector confirmed against a real TradingWorks export from the previous version of this extension. */
const TABLE_FILENAME = 'TWO - Apontamentos';

export function extractAttendanceHistory(document: Document): AttendanceHistoryRow[] {
  const table = findTableByFilename(document, TABLE_FILENAME) ?? document.querySelector<HTMLTableElement>('table');
  const { rows } = parseGridViewTable(table);

  return rows.map((row) => {
    const entriesRaw = pickColumn(row, ['jornada', 'marcacoes', 'entradas', 'entries', 'pontos']);
    const worked = pickColumn(row, ['horas_trab', 'horas_trabalhadas', 'trabalhado', 'worked']);
    const balance = pickColumn(row, ['saldo', 'balance']);

    return {
      date: pickColumn(row, ['data', 'date']),
      entries: entriesRaw
        .split(/[,/]|\s{2,}/)
        .map((entry) => entry.trim())
        .filter(Boolean),
      workedMinutes: worked ? timeToMinutes(worked) : null,
      balanceMinutes: balance ? parseSignedBalance(balance) : null,
    };
  });
}
