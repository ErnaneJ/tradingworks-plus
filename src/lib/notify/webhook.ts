import type { RenderedNotification } from './render';

export interface WebhookPayload {
  title: string;
  message: string;
  timestamp: string;
}

export async function sendWebhook(url: string, notification: RenderedNotification): Promise<void> {
  const payload: WebhookPayload = {
    title: notification.title,
    message: notification.body,
    timestamp: new Date().toISOString(),
  };

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
