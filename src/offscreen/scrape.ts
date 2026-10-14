import { tradingWorksClient, type ClockInOutSnapshot } from '../lib/tw/client';
import type { FastPollData, FieldResult, HistoryPollData } from '../lib/messaging';

/**
 * The offscreen document has no access to chrome.storage, chrome.alarms or
 * chrome.notifications — it exists solely to provide a DOM (DOMParser) for
 * fetching and parsing TradingWorks pages. Every function here is a pure
 * fetch+parse operation; all persistence and notification logic lives in
 * the background service worker, which drives this module over messaging.
 */

async function settle<T>(promise: Promise<T>): Promise<FieldResult<T>> {
  try {
    return { ok: true, data: await promise };
  } catch {
    return { ok: false };
  }
}

export async function fetchFastSnapshot(): Promise<FastPollData> {
  const [clockInOut, timeBankMinutes, home] = await Promise.all([
    tradingWorksClient.fetchClockInOut(),
    tradingWorksClient.fetchTimeBankBalance().catch(() => null),
    settle(tradingWorksClient.fetchHomeSnapshot()),
  ]);

  return { clockInOut, timeBankMinutes, home };
}

export async function fetchHistorySnapshot(): Promise<HistoryPollData> {
  const [
    attendanceHistory,
    timeBankHistory,
    actual,
    overtimeRequisitions,
    approveManualAttendances,
    wfAllowances,
    compTime,
    listTimeCards,
  ] = await Promise.all([
    settle(tradingWorksClient.fetchAttendanceHistory()),
    settle(tradingWorksClient.fetchTimeCardHistory()),
    settle(tradingWorksClient.fetchActualReport()),
    settle(tradingWorksClient.fetchOvertimeRequisitions()),
    settle(tradingWorksClient.fetchApproveManualAttendances()),
    settle(tradingWorksClient.fetchWFAllowancesReport()),
    settle(tradingWorksClient.fetchCompTimeReport()),
    settle(tradingWorksClient.fetchListTimeCardsReport()),
  ]);

  return {
    attendanceHistory,
    timeBankHistory,
    actual,
    overtimeRequisitions,
    approveManualAttendances,
    wfAllowances,
    compTime,
    listTimeCards,
  };
}

/** Returns the postback's own response page, the freshest and most authoritative read of the punch's result. */
export async function punch(): Promise<ClockInOutSnapshot> {
  return tradingWorksClient.punch();
}
