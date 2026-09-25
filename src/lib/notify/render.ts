import type { Translate } from '../i18n';
import type { NotificationEvent } from './events';

export interface RenderedNotification {
  title: string;
  body: string;
}

export function renderEvent(event: NotificationEvent, t: Translate): RenderedNotification {
  const appName = t('common.appName');

  switch (event.kind) {
    case 'settings-changed':
      return { title: appName, body: t('notifications.settingsChangedBody') };
    case 'punch-in':
      return { title: appName, body: t('notifications.punchInBody') };
    case 'punch-out':
      return { title: appName, body: t('notifications.punchOutBody') };
    case 'break-finished':
      return { title: appName, body: t('notifications.breakFinishedBody') };
    case 'shift-ending-soon':
      return { title: appName, body: t('notifications.shiftEndingSoonBody', { minutes: event.minutesLeft }) };
    case 'break-ending-soon':
      return { title: appName, body: t('notifications.breakEndingSoonBody', { minutes: event.minutesLeft }) };
    case 'shift-finished':
      return { title: t('notifications.shiftFinishedTitle'), body: t('notifications.shiftFinishedBody') };
    case 'overtime-threshold':
      return { title: appName, body: t('notifications.overtimeThresholdBody', { minutes: event.minutes }) };
    case 'attendance-alert':
      return { title: appName, body: t('notifications.attendanceAlertBody', { label: event.label, count: event.count }) };
  }
}
