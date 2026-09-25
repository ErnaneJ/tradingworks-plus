import type { Locale } from '../i18n/types';

export interface WebhookSettings {
  url: string;
}

export interface DiscordSettings {
  url: string;
}

export type Theme = 'light' | 'dark' | 'system';

export type PopupLayout = 'standard' | 'compact' | 'minimal' | 'stats' | 'timeline' | 'full' | 'classic';

/** A single notification channel a per-event row can toggle. */
export type NotificationChannel = 'browser' | 'webhook' | 'discord';

/**
 * Per-event-kind channel toggles. Keyed by NotificationEvent['kind'] (see
 * lib/notify/events.ts), kept as Record<string, ...> to avoid a storage → notify
 * dependency, mirroring the RawReport/GridViewResult pattern.
 */
export type NotificationChannelSettings = Record<NotificationChannel, boolean>;

export interface Settings {
  locale: Locale;
  theme: Theme;
  popupLayout: PopupLayout;
  extensionEnabled: boolean;
  pollingIntervalMinutes: number;
  /** Which channels fire for each notification event kind. */
  notificationChannels: Record<string, NotificationChannelSettings>;
  /** Expected worked minutes per day, used to detect the shift-ending-soon and overtime notification thresholds. */
  dailyRequiredWorkMinutes: number;
  /** Expected break duration, used to detect the break-ending-soon notification thresholds. */
  breakDurationMinutes: number;
  webhook: WebhookSettings;
  discord: DiscordSettings;
}

export const SETTINGS_KEY = 'settings';

const DEFAULT_CHANNELS: NotificationChannelSettings = { browser: true, webhook: false, discord: false };

/** The 9 NotificationEvent kinds from lib/notify/events.ts, duplicated here to avoid a storage → notify dependency. */
export const NOTIFICATION_EVENT_KINDS = [
  'settings-changed',
  'punch-in',
  'punch-out',
  'break-finished',
  'shift-ending-soon',
  'break-ending-soon',
  'shift-finished',
  'overtime-threshold',
  'attendance-alert',
] as const;

export const DEFAULT_SETTINGS: Settings = {
  locale: 'en',
  theme: 'system',
  popupLayout: 'standard',
  extensionEnabled: true,
  pollingIntervalMinutes: 1,
  notificationChannels: Object.fromEntries(NOTIFICATION_EVENT_KINDS.map((kind) => [kind, { ...DEFAULT_CHANNELS }])),
  dailyRequiredWorkMinutes: 480,
  breakDurationMinutes: 60,
  webhook: { url: '' },
  discord: { url: '' },
};

export type WorkStatus =
  | 'not-started'
  | 'working'
  | 'on-break'
  | 'finished'
  | 'not-logged-in'
  | 'disabled'
  | 'checking';

export interface PunchEntry {
  /** "HH:mm" as displayed by TradingWorks. */
  time: string;
  kind: 'in' | 'out';
}

export interface DayInterval {
  start: string;
  end: string | null;
  kind: 'worked' | 'break';
  durationMinutes: number | null;
}

export interface AttendanceHistoryRow {
  date: string;
  entries: string[];
  workedMinutes: number | null;
  balanceMinutes: number | null;
}

export interface TimeBankHistoryRow {
  date: string;
  balanceMinutes: number | null;
  description: string;
}

/** One row of MyTimeCards.aspx's payroll-period summary table (e.g. period "09/2026" and its closing balance). */
export interface MonthlyTimeBankRow {
  period: string;
  balanceMinutes: number | null;
}

/** A "Alertas sobre apontamentos" item scraped from the TradingWorks home page (e.g. "9 Horas extras para aprovar"). */
export interface AttendanceAlert {
  id: string;
  label: string;
  count: number;
  href: string;
}

/** Structurally compatible with GridViewResult from lib/tw/parsers/gridView, kept local to avoid a storage → tw dependency. */
export interface RawReport {
  headers: { key: string; label: string }[];
  rows: Record<string, string>[];
}

export interface TrackedState {
  status: WorkStatus;
  punches: PunchEntry[];
  intervals: DayInterval[];
  workedMinutes: number;
  breakMinutes: number;
  /** Signed minutes; positive is a surplus, negative is owed time. Null when unknown. */
  timeBankMinutes: number | null;
  attendanceHistory: AttendanceHistoryRow[];
  timeBankHistory: TimeBankHistoryRow[];
  /** Payroll-period (month) closing balances, for the multi-month time-bank evolution chart. */
  monthlyTimeBankHistory: MonthlyTimeBankRow[];
  /** Lower-priority report pages (Actual, overtime requisitions, manual attendance approvals, WF allowances, CompTimeList, ListTimeCards), keyed by page name. */
  extraReports: Record<string, RawReport>;
  /** Display name scraped from the TradingWorks home page. */
  userName: string | null;
  /** Short-lived SAS-signed avatar URL scraped from the TradingWorks home page; refreshed on every history poll. */
  userPhotoUrl: string | null;
  attendanceAlerts: AttendanceAlert[];
  lastUpdatedAt: number | null;
  lastError: string | null;
}

export const STATE_KEY = 'state';

export const DEFAULT_STATE: TrackedState = {
  status: 'checking',
  punches: [],
  intervals: [],
  workedMinutes: 0,
  breakMinutes: 0,
  timeBankMinutes: null,
  attendanceHistory: [],
  timeBankHistory: [],
  monthlyTimeBankHistory: [],
  extraReports: {},
  userName: null,
  userPhotoUrl: null,
  attendanceAlerts: [],
  lastUpdatedAt: null,
  lastError: null,
};

/** Per-day dedup ledger so we notify about an event/threshold only once a day. */
export interface DispatchLedger {
  date: string;
  dispatchedEvents: string[];
}

export const DISPATCH_LEDGER_KEY = 'dispatchLedger';

export const DEFAULT_DISPATCH_LEDGER: DispatchLedger = {
  date: '',
  dispatchedEvents: [],
};
