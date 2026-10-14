import type { Settings } from '../storage/schema';
import type { Translate } from '../i18n';
import type { NotificationEvent } from './events';
import { renderEvent } from './render';
import { showBrowserNotification } from './browser';
import { sendWebhook } from './webhook';
import { sendDiscordNotification } from './discord';

export async function dispatchEvents(events: NotificationEvent[], settings: Settings, t: Translate): Promise<void> {
  for (const event of events) {
    const rendered = renderEvent(event, t);
    const channels = settings.notificationChannels[event.kind];

    if (channels?.browser) {
      showBrowserNotification(rendered);
    }
    if (channels?.webhook && settings.webhook.url) {
      await sendWebhook(settings.webhook.url, rendered).catch(() => undefined);
    }
    if (channels?.discord && settings.discord.url) {
      await sendDiscordNotification(settings.discord.url, rendered).catch(() => undefined);
    }
  }
}
