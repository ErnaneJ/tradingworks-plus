import type { ClockInOutSnapshot } from './tw/client';
import type { GridViewResult } from './tw/parsers/gridView';
import type { HomeSnapshot } from './tw/parsers/home';
import type { AttendanceHistoryRow, MonthlyTimeBankRow, TimeBankHistoryRow } from './storage/schema';

/**
 * Two message families, kept deliberately distinct so a single
 * `chrome.runtime.sendMessage` broadcast never gets handled twice:
 *
 * - `PublicRequest`: popup/options -> background only.
 * - `OffscreenRequest`: background -> offscreen document only, sent after
 *   background has made sure the offscreen document exists.
 *
 * The offscreen document has no access to chrome.storage, chrome.alarms or
 * chrome.notifications (only a DOM and a handful of extension APIs are
 * exposed there), so it only ever fetches + parses TradingWorks pages and
 * hands the raw result back. All persistence, scheduling and notification
 * dispatch happens in the background service worker.
 */

export type PublicRequest = { type: 'request-punch' } | { type: 'request-refresh' };

export type OffscreenRequest = { type: 'poll-fast' } | { type: 'poll-history' } | { type: 'punch' };

export interface BasicResponse {
  ok: boolean;
  error?: string;
}

/** A field fetched by the offscreen document, which may have failed independently of the others in the same batch. */
export type FieldResult<T> = { ok: true; data: T } | { ok: false };

export interface FastPollData {
  clockInOut: ClockInOutSnapshot;
  timeBankMinutes: number | null;
  home: FieldResult<HomeSnapshot>;
}

export interface HistoryPollData {
  attendanceHistory: FieldResult<AttendanceHistoryRow[]>;
  timeBankHistory: FieldResult<{ history: TimeBankHistoryRow[]; monthly: MonthlyTimeBankRow[] }>;
  actual: FieldResult<GridViewResult>;
  overtimeRequisitions: FieldResult<GridViewResult>;
  approveManualAttendances: FieldResult<GridViewResult>;
  wfAllowances: FieldResult<GridViewResult>;
  compTime: FieldResult<GridViewResult>;
  listTimeCards: FieldResult<GridViewResult>;
}

export interface OffscreenResponse extends BasicResponse {
  fastData?: FastPollData;
  historyData?: HistoryPollData;
  punchData?: ClockInOutSnapshot;
}

function hasType(value: unknown): value is { type: unknown } {
  return typeof value === 'object' && value !== null && 'type' in value;
}

export function isPublicRequest(value: unknown): value is PublicRequest {
  return hasType(value) && (value.type === 'request-punch' || value.type === 'request-refresh');
}

export function isOffscreenRequest(value: unknown): value is OffscreenRequest {
  return hasType(value) && (value.type === 'poll-fast' || value.type === 'poll-history' || value.type === 'punch');
}
