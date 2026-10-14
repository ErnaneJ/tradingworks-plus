import { parseSignedBalance } from '../../domain/time';
import { findTableByHeaderSlug, parseGridViewTable } from './gridView';
import { pickColumn } from './rowMapping';
import type { MonthlyTimeBankRow, TimeBankHistoryRow } from '../../storage/schema';

const BALANCE_LABEL_SELECTORS = ['#Body_Body_lblBalance', '#ctl00_ctl00_Body_Body_lblBalance'];

/** Parses the current time-bank balance shown at the top of MyTimeCards.aspx. */
export function extractTimeBankBalance(document: Document): number | null {
  for (const selector of BALANCE_LABEL_SELECTORS) {
    const label = document.querySelector(selector);
    const text = label?.textContent?.trim();
    if (text) return parseSignedBalance(text);
  }
  return null;
}

/**
 * Parses the personal per-day time-bank ledger table on MyTimeCards.aspx
 * (Data/Horas/Balanço/Tipo/Observações) into history rows. This page also
 * renders an unrelated monthly-summary table with no id/class to tell them
 * apart, so the real ledger is located by its "Balanço" header instead.
 */
export function extractTimeCardHistory(document: Document): TimeBankHistoryRow[] {
  const table = findTableByHeaderSlug(document, ['balanco']);
  const { rows } = parseGridViewTable(table);

  return rows.map((row) => ({
    date: pickColumn(row, ['data', 'periodo', 'date', 'period']),
    balanceMinutes: parseSignedBalance(pickColumn(row, ['balanco', 'saldo', 'balance'])),
    description: pickColumn(row, ['tipo', 'observacoes', 'descricao', 'description', 'observacao']),
  }));
}

/**
 * Parses the other, unrelated table on MyTimeCards.aspx: one row per
 * payroll period ("Folha") with that period's closing time-bank balance.
 * Unlike the per-day ledger above, this one already has a month-level
 * granularity, so it directly feeds a "time bank over the months" chart.
 */
export function extractMonthlyTimeBankHistory(document: Document): MonthlyTimeBankRow[] {
  const table = findTableByHeaderSlug(document, ['folha']);
  const { rows } = parseGridViewTable(table);

  return rows.map((row) => ({
    period: pickColumn(row, ['folha', 'periodo', 'period']),
    balanceMinutes: parseSignedBalance(pickColumn(row, ['banco_de_horas', 'saldo', 'balance'])),
  }));
}
