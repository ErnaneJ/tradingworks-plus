/**
 * ASP.NET WebForms postback helpers.
 *
 * TradingWorks' UI is built on the classic WebForms `__doPostBack(target, argument)`
 * mechanic: every meaningful action on a page (including the clock in/out button)
 * is really a form submit carrying a handful of framework-managed hidden fields
 * plus an anti-forgery token, re-posted to the same page URL.
 */

const FRAMEWORK_FIELD_NAMES = ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION'] as const;

export interface HarvestedFields {
  [name: string]: string;
}

/** Reads every hidden input on the page needed to replay a postback. */
export function harvestHiddenFields(document: Document): HarvestedFields {
  const fields: HarvestedFields = {};

  for (const name of FRAMEWORK_FIELD_NAMES) {
    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (input) fields[name] = input.value;
  }

  const antiForgery = document.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]');
  if (antiForgery) fields.__RequestVerificationToken = antiForgery.value;

  return fields;
}

/** Reads the current value of one or more named hidden/text inputs, if present. Missing inputs are omitted. */
export function harvestNamedFields(document: Document, names: string[]): HarvestedFields {
  const fields: HarvestedFields = {};
  for (const name of names) {
    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (input) fields[name] = input.value;
  }
  return fields;
}

export interface PostbackOptions {
  eventTarget: string;
  eventArgument?: string;
  harvested: HarvestedFields;
  /** Additional named fields to send verbatim (e.g. the punch button's reason/photo/geolocation fields). */
  extraFields?: HarvestedFields;
}

/** Builds the application/x-www-form-urlencoded body for a WebForms postback. */
export function buildPostbackBody({ eventTarget, eventArgument = '', harvested, extraFields = {} }: PostbackOptions): URLSearchParams {
  const body = new URLSearchParams();
  body.set('__EVENTTARGET', eventTarget);
  body.set('__EVENTARGUMENT', eventArgument);

  for (const [name, value] of Object.entries(harvested)) {
    body.set(name, value);
  }
  for (const [name, value] of Object.entries(extraFields)) {
    body.set(name, value);
  }

  return body;
}
