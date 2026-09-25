import type { RenderedNotification } from './render';

const BRAND_GREEN = 0x8fa82a;

function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  timestamp: string;
  footer: { text: string };
}

export async function sendDiscordNotification(
  webhookUrl: string,
  notification: RenderedNotification,
  accentColorHex = '#8FA82A',
): Promise<void> {
  const embed: DiscordEmbed = {
    title: notification.title,
    description: notification.body,
    color: accentColorHex ? hexToDecimal(accentColorHex) : BRAND_GREEN,
    timestamp: new Date().toISOString(),
    footer: { text: 'TradingWorks+' },
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
