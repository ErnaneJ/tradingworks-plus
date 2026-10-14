import { describe, expect, it } from 'vitest';
import { extractMonthlyTimeBankHistory, extractTimeBankBalance, extractTimeCardHistory } from '../../src/lib/tw/parsers/myTimeCards';

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('extractTimeBankBalance', () => {
  it('reads the balance from the primary label id', () => {
    const doc = parseHtml('<span id="Body_Body_lblBalance">-01:30</span>');
    expect(extractTimeBankBalance(doc)).toBe(-90);
  });

  it('falls back to the alternate label id', () => {
    const doc = parseHtml('<span id="ctl00_ctl00_Body_Body_lblBalance">+03:00</span>');
    expect(extractTimeBankBalance(doc)).toBe(180);
  });

  it('returns null when neither label is present', () => {
    expect(extractTimeBankBalance(parseHtml('<div></div>'))).toBeNull();
  });
});

describe('extractTimeCardHistory', () => {
  it('finds the real per-day ledger table by its Balanço header, skipping the unrelated monthly-summary table', () => {
    const doc = parseHtml(`
      <table>
        <thead><tr><th>Folha</th><th>Faltas</th><th>Horas Reg.</th><th>Horas Trab.</th><th>Banco de horas</th></tr></thead>
        <tbody><tr><td>09/2026</td><td>0</td><td>160:00</td><td>172:35</td><td>19:22</td></tr></tbody>
      </table>
      <table>
        <thead><tr><th>Data</th><th>Horas</th><th>Balanço</th><th>Tipo</th><th>Observações</th></tr></thead>
        <tbody><tr><td>30/09/26</td><td>-12:35</td><td>19:22</td><td>Transf. folha</td><td></td></tr></tbody>
      </table>
    `);

    expect(extractTimeCardHistory(doc)).toEqual([{ date: '30/09/26', balanceMinutes: 1162, description: 'Transf. folha' }]);
  });

  it('returns an empty list when no ledger table is found', () => {
    expect(extractTimeCardHistory(parseHtml('<div></div>'))).toEqual([]);
  });
});

describe('extractMonthlyTimeBankHistory', () => {
  it('reads the payroll-period summary table by its Folha header, skipping the per-day ledger table', () => {
    const doc = parseHtml(`
      <table>
        <thead><tr><th>Folha</th><th>Faltas</th><th>Horas Reg.</th><th>Horas Trab.</th><th>Banco de horas</th></tr></thead>
        <tbody><tr><td>09/2026</td><td>0</td><td>160:00</td><td>172:35</td><td>19:22</td></tr></tbody>
      </table>
      <table>
        <thead><tr><th>Data</th><th>Horas</th><th>Balanço</th><th>Tipo</th><th>Observações</th></tr></thead>
        <tbody><tr><td>30/09/26</td><td>-12:35</td><td>19:22</td><td>Transf. folha</td><td></td></tr></tbody>
      </table>
    `);

    expect(extractMonthlyTimeBankHistory(doc)).toEqual([{ period: '09/2026', balanceMinutes: 1162 }]);
  });

  it('returns an empty list when no summary table is found', () => {
    expect(extractMonthlyTimeBankHistory(parseHtml('<div></div>'))).toEqual([]);
  });
});
