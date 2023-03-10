window.addEventListener('DOMContentLoaded', async () => {
  const [trandingworksDom] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.query({}, function(tabs) { 
    tabs.forEach(tab => {
      if(tab.url.includes('app.tradingworks.net') && tab.id !== trandingworksDom.id) chrome.tabs.remove(tab.id, () => { });
    }); 
  });

  chrome.tabs.update(trandingworksDom.id, {
    url: 'https://app.tradingworks.net/',
    pinned: true,
    selected: true
  });

  if (trandingworksDom.url.includes('chrome://')){
    console.log('can`t run on start page');
  }else if(trandingworksDom.url.includes('app.tradingworks.net')){
    chrome.scripting.executeScript({
      target: { tabId: trandingworksDom.id },
      files: ['./assets/scripts/loadExtension.js']
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.msg === "popup_update") updateContent(document, request.data);
      }
    );
  }
});