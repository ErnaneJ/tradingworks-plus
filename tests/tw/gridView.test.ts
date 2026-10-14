import { describe, expect, it } from 'vitest';
import {
  findTableByFilename,
  findTableById,
  findTableByHeaderSlug,
  parseGridViewTable,
  slugifyHeader,
} from '../../src/lib/tw/parsers/gridView';

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('slugifyHeader', () => {
  it('lowercases and strips accents/punctuation', () => {
    expect(slugifyHeader('Saída')).toBe('saida');
    expect(slugifyHeader('Horas Trabalhadas')).toBe('horas_trabalhadas');
  });

  it('trims leading/trailing separators produced by punctuation', () => {
    expect(slugifyHeader('  % Saldo!  ')).toBe('saldo');
  });
});

describe('parseGridViewTable', () => {
  it('parses a table with a semantic thead/tbody', () => {
    const doc = parseHtml(`
      <table>
        <thead><tr><th>Data</th><th>Saldo</th></tr></thead>
        <tbody>
          <tr><td>01/09</td><td>+02:15</td></tr>
          <tr><td>02/09</td><td>-00:45</td></tr>
        </tbody>
      </table>
    `);

    const result = parseGridViewTable(doc.querySelector('table'));

    expect(result.headers).toEqual([
      { key: 'data', label: 'Data' },
      { key: 'saldo', label: 'Saldo' },
    ]);
    expect(result.rows).toEqual([
      { data: '01/09', saldo: '+02:15' },
      { data: '02/09', saldo: '-00:45' },
    ]);
  });

  it('parses an ASP.NET-style GridView with the header row as the first <tr> of an implicit tbody', () => {
    const doc = parseHtml(`
      <table>
        <tr><th>Data</th><th>Saldo</th></tr>
        <tr><td>01/09</td><td>+02:15</td></tr>
      </table>
    `);

    const result = parseGridViewTable(doc.querySelector('table'));

    expect(result.headers).toEqual([
      { key: 'data', label: 'Data' },
      { key: 'saldo', label: 'Saldo' },
    ]);
    expect(result.rows).toEqual([{ data: '01/09', saldo: '+02:15' }]);
  });

  it('returns empty headers/rows for a null table', () => {
    expect(parseGridViewTable(null)).toEqual({ headers: [], rows: [] });
  });

  it('returns empty headers/rows when the table has no header cells', () => {
    const doc = parseHtml('<table><tr><td>just data</td></tr></table>');
    expect(parseGridViewTable(doc.querySelector('table'))).toEqual({ headers: [], rows: [] });
  });

  it('fills missing trailing cells with empty strings', () => {
    const doc = parseHtml(`
      <table>
        <thead><tr><th>Data</th><th>Saldo</th></tr></thead>
        <tbody><tr><td>01/09</td></tr></tbody>
      </table>
    `);

    expect(parseGridViewTable(doc.querySelector('table')).rows).toEqual([{ data: '01/09', saldo: '' }]);
  });

  it('suffixes repeated header labels deterministically instead of colliding on the same slug', () => {
    const doc = parseHtml(`
      <table>
        <thead><tr><th>Horas Totais</th><th>Data</th><th>Horas Totais</th></tr></thead>
        <tbody><tr><td>08:00</td><td>01/09</td><td>16:00</td></tr></tbody>
      </table>
    `);

    const result = parseGridViewTable(doc.querySelector('table'));
    expect(result.headers).toEqual([
      { key: 'horas_totais', label: 'Horas Totais' },
      { key: 'data', label: 'Data' },
      { key: 'horas_totais__2', label: 'Horas Totais' },
    ]);
    expect(result.rows).toEqual([{ horas_totais: '08:00', data: '01/09', horas_totais__2: '16:00' }]);
  });
});

describe('findTableByFilename', () => {
  it('finds the table by its data-filename attribute', () => {
    const doc = parseHtml('<table data-filename="TWO - Apontamentos"><tr><th>Data</th></tr></table>');
    expect(findTableByFilename(doc, 'TWO - Apontamentos')).not.toBeNull();
    expect(findTableByFilename(doc, 'Something Else')).toBeNull();
  });
});

describe('findTableById', () => {
  it('finds a table whose id ends with the given ASP.NET control id suffix', () => {
    const doc = parseHtml('<table id="ctl00_ctl00_Body_Body_gvTimeCards"><tr><th>Data</th></tr></table>');
    expect(findTableById(doc, 'gvTimeCards')).not.toBeNull();
    expect(findTableById(doc, 'gvOther')).toBeNull();
  });
});

describe('findTableByHeaderSlug', () => {
  it('finds the table with no id/class by matching a header slug', () => {
    const doc = parseHtml(`
      <table><tr><th>Folha</th><th>Banco de horas</th></tr></table>
      <table><tr><th>Data</th><th>Balanço</th></tr></table>
    `);

    const table = findTableByHeaderSlug(doc, ['balanco']);
    expect(table?.querySelector('th:nth-child(2)')?.textContent).toBe('Balanço');
  });

  it('returns null when no table has a matching header', () => {
    const doc = parseHtml('<table><tr><th>Data</th></tr></table>');
    expect(findTableByHeaderSlug(doc, ['balanco'])).toBeNull();
  });
});
