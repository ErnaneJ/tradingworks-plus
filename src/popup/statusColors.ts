import type { WorkStatus } from '../lib/storage/schema';

export function statusColor(status: WorkStatus): string {
  switch (status) {
    case 'working':
      return 'var(--color-working)';
    case 'on-break':
      return 'var(--color-break)';
    case 'finished':
      return 'var(--color-brand)';
    default:
      return 'var(--color-text-muted)';
  }
}

const STATUS_TRANSLATION_KEY: Record<WorkStatus, string> = {
  'not-started': 'status.notStarted',
  working: 'status.working',
  'on-break': 'status.onBreak',
  finished: 'status.finished',
  'not-logged-in': 'status.notLoggedIn',
  disabled: 'status.disabled',
  checking: 'status.checking',
};

export function statusTranslationKey(status: WorkStatus): string {
  return STATUS_TRANSLATION_KEY[status];
}
