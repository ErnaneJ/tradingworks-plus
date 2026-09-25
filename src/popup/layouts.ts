import type { PopupLayout } from '../lib/storage/schema';

/**
 * Cycling order for the header's layout switcher, and the single source of
 * truth for which PopupLayout values exist (GeneralTab's dropdown reuses this).
 */
export const POPUP_LAYOUT_ORDER: PopupLayout[] = ['standard', 'compact', 'minimal', 'stats', 'timeline', 'full', 'classic'];

/** Popup width per layout — each variant's composition earns its own footprint rather than reusing one shell size. */
export const POPUP_LAYOUT_WIDTHS: Record<PopupLayout, number> = {
  standard: 340,
  compact: 280,
  minimal: 240,
  stats: 320,
  timeline: 360,
  full: 380,
  classic: 300,
};

export function nextPopupLayout(current: PopupLayout): PopupLayout {
  const index = POPUP_LAYOUT_ORDER.indexOf(current);
  return POPUP_LAYOUT_ORDER[(index + 1) % POPUP_LAYOUT_ORDER.length];
}

/** i18n key for each layout's display name, shared by the options General tab and the popup's cycle-switcher tooltip. */
export const POPUP_LAYOUT_NAME_KEYS: Record<PopupLayout, string> = {
  standard: 'options.popupLayoutStandard',
  compact: 'options.popupLayoutCompact',
  minimal: 'options.popupLayoutMinimal',
  stats: 'options.popupLayoutStats',
  timeline: 'options.popupLayoutTimeline',
  full: 'options.popupLayoutFull',
  classic: 'options.popupLayoutClassic',
};
