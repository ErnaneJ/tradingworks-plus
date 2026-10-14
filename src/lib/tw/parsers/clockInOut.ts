import { slugifyHeader } from './gridView';

/**
 * Parser for /Attendances/ClockInOut.aspx — the page behind the "punch"
 * button. The same "Apontamentos de {date}" table also appears on
 * Default.aspx, so this locates it by header content rather than a fixed
 * id, and both pages can reuse it.
 *
 * Confirmed live markup: a table with two header rows (a title row, then a
 * Período/Início/Término/HT row) followed by one data row per period. Each
 * data row has 4 <td>s: period label, Início (an <i class="fa fa-clock-o">
 * icon followed by "HH:mm", or empty if the period hasn't started), Término
 * (same pattern, empty if the period is still open) and HT (a "HH:mm h"
 * duration, empty if still open).
 */

export const CLOCK_BUTTON_EVENT_TARGET = 'ctl00$ctl00$Body$Body$btnAttendance';

const TIME_PATTERN = /\b([01]\d|2[0-3]):([0-5]\d)\b/;

const HEADER_SLUGS = { periodo: 'periodo', inicio: 'inicio', termino: 'termino' };

/**
 * Finds the "Apontamentos de {date}" table's header row, wherever it sits in the table.
 *
 * Rows are read via `table.querySelectorAll('tr')` (flattened across any `<thead>`/`<tbody>`
 * split) rather than `headerRow.parentElement.children`: TradingWorks renders the header row
 * inside its own `<thead>` on some pages, which would otherwise leave the data rows — siblings
 * under a separate `<tbody>` — undiscoverable from the header row's parent.
 */
function findAttendanceTable(document: Document): { rows: HTMLTableRowElement[]; headerIndex: number } | null {
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>('table'));
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tr'));
    const headerIndex = rows.findIndex((row) => {
      const slugs = Array.from(row.querySelectorAll('th, td')).map((cell) => slugifyHeader(cell.textContent ?? ''));
      return slugs.includes(HEADER_SLUGS.periodo) && slugs.includes(HEADER_SLUGS.inicio);
    });
    if (headerIndex !== -1) return { rows, headerIndex };
  }
  return null;
}

/** Extracts punch times in chronological order (Início, Término, Início, Término, ...) from the attendance table. */
export function extractPunchTimes(document: Document): string[] {
  const found = findAttendanceTable(document);
  if (!found) return [];

  const { rows, headerIndex } = found;
  const headerRow = rows[headerIndex];
  const headerCells = Array.from(headerRow.querySelectorAll('th, td'));
  const headerSlugs = headerCells.map((cell) => slugifyHeader(cell.textContent ?? ''));
  const inicioIndex = headerSlugs.indexOf(HEADER_SLUGS.inicio);
  const terminoIndex = headerSlugs.indexOf(HEADER_SLUGS.termino);
  if (inicioIndex === -1) return [];

  const dataRows = rows.slice(headerIndex + 1);

  const times: string[] = [];
  for (const row of dataRows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length === 0) continue;

    const inicioText = cells[inicioIndex]?.textContent ?? '';
    const inicioMatch = inicioText.match(TIME_PATTERN);
    if (!inicioMatch) break;
    times.push(inicioMatch[0]);

    const terminoText = terminoIndex !== -1 ? (cells[terminoIndex]?.textContent ?? '') : '';
    const terminoMatch = terminoText.match(TIME_PATTERN);
    if (!terminoMatch) break;
    times.push(terminoMatch[0]);
  }

  return times;
}

export function extractStatusLabel(document: Document): string | null {
  const text = document.querySelector('#Body_lblAttendanceStatus')?.textContent?.trim();
  return text || null;
}
