import type { AttendanceAlert } from '../../storage/schema';

/**
 * Parser for /Default.aspx — the TradingWorks home page. Confirmed live
 * markup: `#Body_lblNickName` (display name), `#Body_imgGravatar` (a
 * short-lived SAS-signed Azure Blob avatar URL — must be refetched
 * periodically, never cached long-term) and `#Body_Body_pnlAlertsAttendances`
 * (a `.list-group` of `.list-group-item` links, each with a `.badge` count),
 * which is fully server-rendered and needs no JS/AJAX to read.
 */

export interface HomeSnapshot {
  userName: string | null;
  userPhotoUrl: string | null;
  alerts: AttendanceAlert[];
}

export function extractHomeSnapshot(document: Document): HomeSnapshot {
  const userName = document.querySelector('#Body_lblNickName')?.textContent?.trim() || null;
  const userPhotoUrl = document.querySelector('#Body_imgGravatar')?.getAttribute('src') || null;

  const alertLinks = Array.from(
    document.querySelectorAll('#Body_Body_pnlAlertsAttendances .list-group-item'),
  );
  const alerts: AttendanceAlert[] = alertLinks.map((link, index) => {
    const badgeText = link.querySelector('.badge')?.textContent?.trim() ?? '';
    const label = (link.textContent ?? '').replace(badgeText, '').trim();
    const href = link.getAttribute('href') ?? '';
    return { id: href || `alert-${index}`, label, count: Number(badgeText) || 0, href };
  });

  return { userName, userPhotoUrl, alerts };
}
