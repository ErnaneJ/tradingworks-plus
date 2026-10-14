/**
 * Generic webhooks point at arbitrary, user-supplied origins that usually
 * don't send CORS headers, so a plain fetch() from the background worker
 * gets blocked unless that origin's host permission is actually granted
 * (declaring it in the manifest alone isn't enough). Requesting only the
 * single origin the user typed keeps the grant as narrow as possible,
 * even though the manifest allows any origin to be requested.
 */
export async function ensureOriginPermission(url: string): Promise<boolean> {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return false;
  }

  const pattern = `${origin}/*`;
  const alreadyGranted = await chrome.permissions.contains({ origins: [pattern] });
  if (alreadyGranted) return true;

  return chrome.permissions.request({ origins: [pattern] });
}
