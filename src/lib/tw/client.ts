import { fetchDocument, isLoginPage, postForm } from './http';
import { buildPostbackBody, harvestHiddenFields, harvestNamedFields } from './postback';
import { CLOCK_BUTTON_EVENT_TARGET, extractPunchTimes, extractStatusLabel } from './parsers/clockInOut';
import { extractAttendanceHistory } from './parsers/listAttendances';
import { extractMonthlyTimeBankHistory, extractTimeBankBalance, extractTimeCardHistory } from './parsers/myTimeCards';
import { extractGenericReport } from './parsers/genericReport';
import { extractHomeSnapshot, type HomeSnapshot } from './parsers/home';
import type { GridViewResult } from './parsers/gridView';
import type { AttendanceHistoryRow, MonthlyTimeBankRow, TimeBankHistoryRow } from '../storage/schema';

export const PAGES = {
  home: '/Default.aspx',
  clockInOut: '/Attendances/ClockInOut.aspx',
  actual: '/Reports/Actual.aspx',
  listAttendances: '/Attendances/ListAttendances.aspx',
  myTimeCards: '/Payroll/MyTimeCards.aspx',
  myOvertimeRequisitions: '/Payroll/MyOvertimeRequisitions.aspx',
  approveManualAttendances: '/Attendances/ApproveManualAttendances.aspx',
  reportWFAllowances: '/Payroll/ReportWFAllowances.aspx',
  listTimeCards: '/Payroll/ListTimeCards.aspx',
  compTimeList: '/Payroll/CompTimeList.aspx',
} as const;

/** Hidden fields the "Marcar Ponto" button posts alongside the framework fields, at both its declared scopes. */
const PUNCH_FIELD_SUFFIXES = [
  'hddPhoto',
  'rblBaseDate',
  'txtHour',
  'txtWorkerReason',
  'hddLatitude',
  'hddLongitude',
  'hddAccuracy',
  'hddAttendanceAlertMessage',
  'hddGPSError',
];
const INNER_SCOPE_PREFIX = 'ctl00$ctl00$Body$Body$';
const OUTER_SCOPE_PREFIX = 'ctl00$ctl00$Body$';

function punchFieldNames(): string[] {
  return PUNCH_FIELD_SUFFIXES.flatMap((suffix) => [`${INNER_SCOPE_PREFIX}${suffix}`, `${OUTER_SCOPE_PREFIX}${suffix}`]);
}

export interface ClockInOutSnapshot {
  loggedIn: boolean;
  punchTimes: string[];
  statusLabel: string | null;
}

function parseClockInOut(document: Document): ClockInOutSnapshot {
  if (isLoginPage(document)) {
    return { loggedIn: false, punchTimes: [], statusLabel: null };
  }
  return {
    loggedIn: true,
    punchTimes: extractPunchTimes(document),
    statusLabel: extractStatusLabel(document),
  };
}

export class TradingWorksClient {
  async fetchClockInOut(): Promise<ClockInOutSnapshot> {
    const { document } = await fetchDocument(PAGES.clockInOut);
    return parseClockInOut(document);
  }

  /**
   * Replays the "Marcar Ponto" button's postback. Geolocation/photo fields
   * are sent empty (see the outer-scope duplicates TradingWorks itself
   * leaves blank) since an offscreen document cannot prompt for camera or
   * location access; this is a deliberate, documented limitation.
   */
  async punch(): Promise<ClockInOutSnapshot> {
    const { document: freshPage } = await fetchDocument(PAGES.clockInOut);
    if (isLoginPage(freshPage)) {
      return { loggedIn: false, punchTimes: [], statusLabel: null };
    }

    const harvested = harvestHiddenFields(freshPage);
    const extraFields = harvestNamedFields(freshPage, punchFieldNames());

    const body = buildPostbackBody({
      eventTarget: CLOCK_BUTTON_EVENT_TARGET,
      harvested,
      extraFields,
    });

    const { document: resultPage } = await postForm(PAGES.clockInOut, body);
    return parseClockInOut(resultPage);
  }

  async fetchTimeBankBalance(): Promise<number | null> {
    const { document } = await fetchDocument(PAGES.myTimeCards);
    return extractTimeBankBalance(document);
  }

  async fetchTimeCardHistory(): Promise<{ history: TimeBankHistoryRow[]; monthly: MonthlyTimeBankRow[] }> {
    const { document } = await fetchDocument(PAGES.myTimeCards);
    return { history: extractTimeCardHistory(document), monthly: extractMonthlyTimeBankHistory(document) };
  }

  async fetchAttendanceHistory(): Promise<AttendanceHistoryRow[]> {
    const { document } = await fetchDocument(PAGES.listAttendances);
    return extractAttendanceHistory(document);
  }

  /**
   * CompTimeList.aspx and ListTimeCards.aspx are both manager/team reports
   * (a roster of employees' current balances, and a per-employee-per-month
   * payroll summary) — neither has a personal per-day date dimension, so
   * they can't feed `timeBankHistory` (see `fetchTimeCardHistory`). They're
   * parsed generically and kept as team-oriented extra reports instead.
   */
  async fetchCompTimeReport(): Promise<GridViewResult> {
    const { document } = await fetchDocument(PAGES.compTimeList);
    return extractGenericReport(document);
  }

  async fetchListTimeCardsReport(): Promise<GridViewResult> {
    const { document } = await fetchDocument(PAGES.listTimeCards);
    return extractGenericReport(document);
  }

  async fetchActualReport(): Promise<GridViewResult> {
    const { document } = await fetchDocument(PAGES.actual);
    return extractGenericReport(document);
  }

  async fetchOvertimeRequisitions(): Promise<GridViewResult> {
    const { document } = await fetchDocument(PAGES.myOvertimeRequisitions);
    return extractGenericReport(document);
  }

  async fetchApproveManualAttendances(): Promise<GridViewResult> {
    const { document } = await fetchDocument(PAGES.approveManualAttendances);
    return extractGenericReport(document);
  }

  async fetchWFAllowancesReport(): Promise<GridViewResult> {
    const { document } = await fetchDocument(PAGES.reportWFAllowances);
    return extractGenericReport(document);
  }

  async fetchHomeSnapshot(): Promise<HomeSnapshot> {
    const { document } = await fetchDocument(PAGES.home);
    if (isLoginPage(document)) return { userName: null, userPhotoUrl: null, alerts: [] };
    return extractHomeSnapshot(document);
  }
}

export const tradingWorksClient = new TradingWorksClient();
