export const BASE_URL = 'https://app.tradingworks.net';

export class TradingWorksHttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'TradingWorksHttpError';
  }
}

/** Fetches a TradingWorks page and returns it as a parsed Document. Throws if the network call fails. */
export async function fetchDocument(path: string): Promise<{ document: Document; html: string; url: string }> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { credentials: 'include', redirect: 'follow' });
  } catch (cause) {
    throw new TradingWorksHttpError(`Network request to ${path} failed`, undefined);
  }
  if (!response.ok) {
    throw new TradingWorksHttpError(`Request to ${path} returned ${response.status}`, response.status);
  }
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, 'text/html');
  return { document, html, url: response.url };
}

/** Submits an ASP.NET WebForms postback and returns the resulting Document. */
export async function postForm(path: string, body: URLSearchParams): Promise<{ document: Document; html: string }> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (cause) {
    throw new TradingWorksHttpError(`Postback to ${path} failed`, undefined);
  }
  if (!response.ok) {
    throw new TradingWorksHttpError(`Postback to ${path} returned ${response.status}`, response.status);
  }
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, 'text/html');
  return { document, html };
}

/** True when a fetched TradingWorks page is actually the login page (session expired/anonymous). */
export function isLoginPage(document: Document): boolean {
  return (
    document.querySelector('input[name="txtUsername"], #txtUsername') !== null ||
    document.querySelector('form[action*="Login"]') !== null
  );
}
