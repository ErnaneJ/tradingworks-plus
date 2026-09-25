import { isOffscreenRequest, type OffscreenResponse } from '../lib/messaging';
import { fetchFastSnapshot, fetchHistorySnapshot, punch } from './scrape';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isOffscreenRequest(message)) return undefined;

  void (async () => {
    const response: OffscreenResponse = { ok: true };
    try {
      if (message.type === 'poll-fast') {
        response.fastData = await fetchFastSnapshot();
      } else if (message.type === 'poll-history') {
        response.historyData = await fetchHistorySnapshot();
      } else if (message.type === 'punch') {
        await punch();
      }
    } catch (error) {
      response.ok = false;
      response.error = error instanceof Error ? error.message : 'Unknown error';
    }
    sendResponse(response);
  })();

  return true;
});
