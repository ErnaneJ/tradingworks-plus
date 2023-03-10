window.addEventListener('DOMContentLoaded', async () => {
  const [trandingworksDom] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.query({}, function(tabs) { 
    tabs.forEach(tab => {
      if(tab.url.includes('app.tradingworks.net') && tab.id !== trandingworksDom.id) chrome.tabs.remove(tab.id, () => { });
    }); 
  });

  if(trandingworksDom.url.includes('app.tradingworks.net')){
    chrome.scripting.executeScript({
      target: { tabId: trandingworksDom.id },
      files: ['./assets/scripts/loadExtension.js']
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.msg === "popup_update") updateContent(document, request.data);

        sendResponse({ msg: "popup_update_success", config: window.localStorage.getItem('tradingworks-plus-data') });
      }
    );
  }else{
    chrome.tabs.update(trandingworksDom.id, {
      url: 'https://app.tradingworks.net/',
      pinned: true,
      selected: true
    });
  }
});