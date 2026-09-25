import { describe, expect, it } from 'vitest';
import { extractAttendanceHistory } from '../../src/lib/tw/parsers/listAttendances';

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('extractAttendanceHistory', () => {
  it('parses the confirmed "TWO - Apontamentos" table shape', () => {
    const doc = parseHtml(`
      <table data-filename="TWO - Apontamentos">
        <thead>
          <tr><th>Data</th><th>Marcacoes</th><th>Horas Trabalhadas</th><th>Saldo</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>01/09/2026</td>
            <td>08:00, 12:00, 13:00, 17:00</td>
            <td>08:00</td>
            <td>+00:00</td>
          </tr>
        </tbody>
      </table>
    `);

    expect(extractAttendanceHistory(doc)).toEqual([
      {
        date: '01/09/2026',
        entries: ['08:00', '12:00', '13:00', '17:00'],
        workedMinutes: 480,
        balanceMinutes: 0,
      },
    ]);
  });

  it('falls back to the first table on the page when the named table is missing', () => {
    const doc = parseHtml(`
      <table>
        <thead><tr><th>Data</th><th>Entradas</th></tr></thead>
        <tbody><tr><td>02/09/2026</td><td>09:00, 10:00</td></tr></tbody>
      </table>
    `);

    const [row] = extractAttendanceHistory(doc);
    expect(row.date).toBe('02/09/2026');
    expect(row.entries).toEqual(['09:00', '10:00']);
  });

  it('parses the real ListAttendances header labels (Jornada / Horas Trab.)', () => {
    const doc = parseHtml(`
      <table data-filename="TWO - Apontamentos">
        <thead><tr><th>Data</th><th>Jornada</th><th>Horas Trab.</th></tr></thead>
        <tbody><tr><td>04/09/2026</td><td>08:00, 12:00, 13:00, 17:00</td><td>08:00</td></tr></tbody>
      </table>
    `);

    const [row] = extractAttendanceHistory(doc);
    expect(row.entries).toEqual(['08:00', '12:00', '13:00', '17:00']);
    expect(row.workedMinutes).toBe(480);
  });

  it('returns null worked/balance minutes when those columns are blank', () => {
    const doc = parseHtml(`
      <table data-filename="TWO - Apontamentos">
        <thead><tr><th>Data</th><th>Marcacoes</th><th>Horas Trabalhadas</th><th>Saldo</th></tr></thead>
        <tbody><tr><td>03/09/2026</td><td></td><td></td><td></td></tr></tbody>
      </table>
    `);

    const [row] = extractAttendanceHistory(doc);
    expect(row.entries).toEqual([]);
    expect(row.workedMinutes).toBeNull();
    expect(row.balanceMinutes).toBeNull();
  });
});
