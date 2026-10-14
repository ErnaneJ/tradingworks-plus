import { describe, expect, it } from 'vitest';
import { extractPunchTimes, extractStatusLabel } from '../../src/lib/tw/parsers/clockInOut';

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/** Mirrors the real "Apontamentos de {date}" table markup confirmed on ClockInOut.aspx/Default.aspx. */
function attendanceTable(rows: string): string {
  return `
    <table>
      <tbody>
        <tr><td colspan="4">Apontamentos de 24/09/2026</td></tr>
        <tr><th>Período</th><th>Início</th><th>Término</th><th>HT</th></tr>
        ${rows}
      </tbody>
    </table>
  `;
}

/** Mirrors the Default.aspx widget markup, where the header row sits in its own <thead>, separate from the data rows' <tbody>. */
function attendanceTableWithThead(rows: string): string {
  return `
    <table>
      <thead>
        <tr><th>Período</th><th>Início</th><th>Término</th><th>HT</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

describe('extractPunchTimes', () => {
  it('reads Início/Término pairs from the real attendance table for two closed periods', () => {
    const doc = parseHtml(
      attendanceTable(`
        <tr><td>Manhã</td><td><i class="fa fa-clock-o"></i>&nbsp;09:15</td><td><i class="fa fa-clock-o"></i>&nbsp;13:07</td><td>03:52 h</td></tr>
        <tr><td>Tarde</td><td><i class="fa fa-clock-o"></i>&nbsp;13:58</td><td><i class="fa fa-clock-o"></i>&nbsp;16:33</td><td>02:35 h</td></tr>
      `),
    );

    expect(extractPunchTimes(doc)).toEqual(['09:15', '13:07', '13:58', '16:33']);
  });

  it('stops at an open period (no Término yet) instead of picking up the HT column as a fake punch', () => {
    const doc = parseHtml(
      attendanceTable(`
        <tr><td>Manhã</td><td><i class="fa fa-clock-o"></i>&nbsp;09:15</td><td><i class="fa fa-clock-o"></i>&nbsp;13:07</td><td>03:52 h</td></tr>
        <tr><td>Tarde</td><td><i class="fa fa-clock-o"></i>&nbsp;13:58</td><td></td><td></td></tr>
      `),
    );

    expect(extractPunchTimes(doc)).toEqual(['09:15', '13:07', '13:58']);
  });

  it('returns an empty list when the attendance table is not present', () => {
    expect(extractPunchTimes(parseHtml('<body><p>No punches yet</p></body>'))).toEqual([]);
  });

  it('reads punches when the header row sits in its own <thead>, separate from the data rows (Default.aspx widget)', () => {
    const doc = parseHtml(
      attendanceTableWithThead(`
        <tr><td>Manhã</td><td><i class="fa fa-clock-o"></i>&nbsp;09:15</td><td><i class="fa fa-clock-o"></i>&nbsp;13:07</td><td>03:52 h</td></tr>
        <tr><td>Tarde</td><td><i class="fa fa-clock-o"></i>&nbsp;13:58</td><td><i class="fa fa-clock-o"></i>&nbsp;16:33</td><td>02:35 h</td></tr>
        <tr><td>Noite</td><td><i class="fa fa-clock-o"></i>&nbsp;22:47</td><td></td><td></td></tr>
      `),
    );

    expect(extractPunchTimes(doc)).toEqual(['09:15', '13:07', '13:58', '16:33', '22:47']);
  });
});

describe('extractStatusLabel', () => {
  it('returns null since TradingWorks always renders this label empty', () => {
    const doc = parseHtml('<span id="Body_lblAttendanceStatus"></span>');
    expect(extractStatusLabel(doc)).toBeNull();
  });

  it('returns null when the label is not present at all', () => {
    expect(extractStatusLabel(parseHtml('<div>nothing here</div>'))).toBeNull();
  });
});
