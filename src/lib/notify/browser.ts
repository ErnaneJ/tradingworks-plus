import type { RenderedNotification } from './render';

/**
 * `chrome.notifications.create` with a reused id *updates* an existing,
 * still-present notification instead of creating a new one — and on macOS
 * that update doesn't re-alert (no new banner/sound), so a second event
 * would silently vanish. Each notification instead gets a fresh id, with
 * the previous one explicitly cleared first so they still don't stack up
 * in the OS notification center.
 */
let previousNotificationId: string | null = null;

export function showBrowserNotification(notification: RenderedNotification): void {
  const id = `tradingworks-plus-notification-${Date.now()}`;
  if (previousNotificationId) chrome.notifications.clear(previousNotificationId);
  previousNotificationId = id;

  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('assets/icons/favicon48.png'),
    title: notification.title,
    message: notification.body,
  });
}
