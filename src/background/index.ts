import { computeIntervals, computeStatus, inferPunchKinds, sumMinutes } from '../lib/domain/attendance';
import { computeBadge } from '../lib/domain/badge';
import type { ClockInOutSnapshot } from '../lib/tw/client';
import { detectDailyAlertEvents, detectEvents } from '../lib/notify/events';
import { dispatchEvents } from '../lib/notify/dispatch';
import { getFromStorage, setInStorage } from '../lib/storage/local';
import {
  DEFAULT_DISPATCH_LEDGER,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  DISPATCH_LEDGER_KEY,
  SETTINGS_KEY,
  STATE_KEY,
  type DispatchLedger,
  type Settings,
  type TrackedState,
} from '../lib/storage/schema';
import { detectDefaultLocale, translatorFor } from '../lib/i18n';
import {
  isPublicRequest,
  type BasicResponse,
  type FieldResult,
  type OffscreenRequest,
  type OffscreenResponse,
} from '../lib/messaging';

const POLL_FAST_ALARM = 'poll-fast';
const POLL_HISTORY_ALARM = 'poll-history';
const HISTORY_PERIOD_MINUTES = 15;

const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen/index.html';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function resolveField<T>(result: FieldResult<T> | undefined, previous: T): T {
  return result?.ok ? result.data : previous;
}

async function ensureOffscreenDocument(): Promise<void> {
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existing.length > 0) return;

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
    reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
    justification: 'Fetching and parsing TradingWorks HTML pages requires DOM access (DOMParser).',
  });
}

async function ensureInitialSettings(): Promise<Settings> {
  const raw = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = raw[SETTINGS_KEY] as Partial<Settings> | undefined;
  if (stored) return { ...DEFAULT_SETTINGS, ...stored };

  const initial: Settings = { ...DEFAULT_SETTINGS, locale: detectDefaultLocale() };
  await setInStorage(SETTINGS_KEY, initial);
  return initial;
}

async function loadSettings(): Promise<Settings> {
  const settings = await getFromStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  if (!settings.locale) {
    settings.locale = detectDefaultLocale();
  }
  return settings;
}

async function setupAlarms(settings: Settings): Promise<void> {
  await chrome.alarms.clear(POLL_FAST_ALARM);
  await chrome.alarms.create(POLL_FAST_ALARM, { periodInMinutes: Math.max(settings.pollingIntervalMinutes, 1) });

  const existingHistoryAlarm = await chrome.alarms.get(POLL_HISTORY_ALARM);
  if (!existingHistoryAlarm) {
    await chrome.alarms.create(POLL_HISTORY_ALARM, { periodInMinutes: HISTORY_PERIOD_MINUTES });
  }
}

async function updateBadge(state: TrackedState, settings: Settings): Promise<void> {
  const badge = computeBadge(state.status, state.workedMinutes, settings.dailyRequiredWorkMinutes);
  await chrome.action.setBadgeText({ text: badge.text });
  if (badge.text) await chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

async function sendToOffscreen(request: OffscreenRequest): Promise<OffscreenResponse> {
  await ensureOffscreenDocument();
  try {
    const response = (await chrome.runtime.sendMessage(request)) as OffscreenResponse | undefined;
    return response ?? { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetches clock in/out + time bank balance, recomputes derived state, and dispatches any resulting notifications.
 * `clockInOutOverride` lets a caller that already holds a fresher read (the punch postback's own response page)
 * skip this poll's independent re-fetch of that same page, which can otherwise race the server and read back
 * the punch list from just before the new punch was recorded.
 */
async function runFastPoll(clockInOutOverride?: ClockInOutSnapshot): Promise<void> {
  const settings = await loadSettings();
  if (!settings.extensionEnabled) {
    await setInStorage<TrackedState>(STATE_KEY, { ...DEFAULT_STATE, status: 'disabled' });
    return;
  }

  const previous = await getFromStorage<TrackedState>(STATE_KEY, DEFAULT_STATE);
  const response = await sendToOffscreen({ type: 'poll-fast' });

  if (!response.ok || !response.fastData) {
    await setInStorage<TrackedState>(STATE_KEY, { ...previous, lastError: response.error ?? 'Unknown error' });
    return;
  }

  const { timeBankMinutes, home: homeResult } = response.fastData;
  const clockInOut = clockInOutOverride ?? response.fastData.clockInOut;
  const home = homeResult.ok ? homeResult.data : null;

  if (!clockInOut.loggedIn) {
    await setInStorage<TrackedState>(STATE_KEY, { ...DEFAULT_STATE, status: 'not-logged-in', lastUpdatedAt: Date.now() });
    return;
  }

  const punches = inferPunchKinds(clockInOut.punchTimes);
  const now = nowMinutes();
  const provisionalIntervals = computeIntervals(punches, now, false);
  const workedMinutesSoFar = sumMinutes(provisionalIntervals, 'worked');
  const status = computeStatus(punches, clockInOut.statusLabel, workedMinutesSoFar, settings.dailyRequiredWorkMinutes);
  const intervals = computeIntervals(punches, now, status === 'finished');
  const workedMinutes = sumMinutes(intervals, 'worked');
  const breakMinutes = sumMinutes(intervals, 'break');

  const next: TrackedState = {
    ...previous,
    status,
    punches,
    intervals,
    workedMinutes,
    breakMinutes,
    timeBankMinutes,
    userName: home?.userName ?? previous.userName,
    userPhotoUrl: home?.userPhotoUrl ?? previous.userPhotoUrl,
    attendanceAlerts: home?.alerts ?? previous.attendanceAlerts,
    lastUpdatedAt: Date.now(),
    lastError: null,
  };

  await setInStorage(STATE_KEY, next);

  const ledger = await getFromStorage<DispatchLedger>(DISPATCH_LEDGER_KEY, DEFAULT_DISPATCH_LEDGER);
  const { events, ledger: nextLedger } = detectEvents(previous, next, ledger, settings, todayKey());
  if (events.length > 0) {
    await dispatchEvents(events, settings, translatorFor(settings.locale));
  }
  await setInStorage(DISPATCH_LEDGER_KEY, nextLedger);
}

/** Fetches the heavier history/report pages on a slower cadence. */
async function runHistoryPoll(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.extensionEnabled) return;

  const previous = await getFromStorage<TrackedState>(STATE_KEY, DEFAULT_STATE);
  if (previous.status === 'not-logged-in') return;

  const response = await sendToOffscreen({ type: 'poll-history' });
  if (!response.ok || !response.historyData) return;

  const data = response.historyData;
  const extraReports = { ...previous.extraReports };
  if (data.actual.ok) extraReports.actual = data.actual.data;
  if (data.overtimeRequisitions.ok) extraReports.overtimeRequisitions = data.overtimeRequisitions.data;
  if (data.approveManualAttendances.ok) extraReports.approveManualAttendances = data.approveManualAttendances.data;
  if (data.wfAllowances.ok) extraReports.wfAllowances = data.wfAllowances.data;
  if (data.compTime.ok) extraReports.compTime = data.compTime.data;
  if (data.listTimeCards.ok) extraReports.listTimeCards = data.listTimeCards.data;

  const next: TrackedState = {
    ...previous,
    attendanceHistory: resolveField(data.attendanceHistory, previous.attendanceHistory),
    timeBankHistory: data.timeBankHistory.ok ? data.timeBankHistory.data.history : previous.timeBankHistory,
    monthlyTimeBankHistory: data.timeBankHistory.ok ? data.timeBankHistory.data.monthly : previous.monthlyTimeBankHistory,
    extraReports,
  };

  await setInStorage(STATE_KEY, next);

  const ledger = await getFromStorage<DispatchLedger>(DISPATCH_LEDGER_KEY, DEFAULT_DISPATCH_LEDGER);
  const { events, ledger: nextLedger } = detectDailyAlertEvents(next, ledger, todayKey(), nowMinutes());
  if (events.length > 0) {
    await dispatchEvents(events, settings, translatorFor(settings.locale));
  }
  await setInStorage(DISPATCH_LEDGER_KEY, nextLedger);
}

/** Replays the clock in/out postback, then immediately reruns the fast poll using that postback's own fresh punch list. */
async function runPunch(): Promise<BasicResponse> {
  const settings = await loadSettings();
  if (!settings.extensionEnabled) return { ok: false, error: 'Extension disabled' };

  const response = await sendToOffscreen({ type: 'punch' });
  if (!response.ok || !response.punchData) return response;

  await runFastPoll(response.punchData);
  return { ok: true };
}

chrome.runtime.onInstalled.addListener(() => {
  void (async () => {
    await ensureOffscreenDocument();
    const settings = await ensureInitialSettings();
    await setupAlarms(settings);
  })();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureOffscreenDocument();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_FAST_ALARM) {
    void runFastPoll();
  } else if (alarm.name === POLL_HISTORY_ALARM) {
    void runHistoryPoll();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  const settingsChange = changes[SETTINGS_KEY];
  if (settingsChange) {
    const newSettings = settingsChange.newValue as Settings;
    void setupAlarms(newSettings);

    if (settingsChange.oldValue) {
      void dispatchEvents([{ kind: 'settings-changed' }], newSettings, translatorFor(newSettings.locale));
    }
  }

  const stateChange = changes[STATE_KEY];
  if (stateChange) {
    const newState = stateChange.newValue as TrackedState;
    void loadSettings().then((settings) => updateBadge(newState, settings));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isPublicRequest(message)) return undefined;

  void (async () => {
    if (message.type === 'request-punch') {
      sendResponse(await runPunch());
    } else if (message.type === 'request-refresh') {
      // Reset the fast-poll alarm too, so a manual refresh also pushes back
      // the next scheduled one instead of leaving it to fire right after.
      const settings = await loadSettings();
      await chrome.alarms.clear(POLL_FAST_ALARM);
      await chrome.alarms.create(POLL_FAST_ALARM, { periodInMinutes: Math.max(settings.pollingIntervalMinutes, 1) });
      await runFastPoll();
      await runHistoryPoll();
      sendResponse({ ok: true });
    }
  })();

  return true;
});

void (async () => {
  const settings = await getFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  await setupAlarms(settings);
  const state = await getFromStorage<TrackedState>(STATE_KEY, DEFAULT_STATE);
  await updateBadge(state, settings);
})();
