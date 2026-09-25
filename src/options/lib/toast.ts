import { writable } from 'svelte/store';

export interface ToastItem {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

export const toasts = writable<ToastItem[]>([]);

let nextId = 0;
const DURATION_MS = 3000;

/** Shows a passive, auto-dismissing toast instead of inline feedback that shifts layout. */
export function pushToast(message: string, variant: ToastItem['variant'] = 'success'): void {
  const id = nextId++;
  toasts.update((current) => [...current, { id, message, variant }]);
  setTimeout(() => {
    toasts.update((current) => current.filter((item) => item.id !== id));
  }, DURATION_MS);
}
