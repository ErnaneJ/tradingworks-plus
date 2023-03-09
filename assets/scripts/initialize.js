window.addEventListener('DOMContentLoaded', async () => {
    const [trandingworksDom] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (trandingworksDom.url.includes('chrome://')){
      console.log('can`t run on start page');
    }else{
      chrome.scripting.executeScript({
        target: { tabId: trandingworksDom.id },
        files: ['./assets/scripts/loadExtension.js']
      });
    }
  });