window.addEventListener('DOMContentLoaded', async () => {
  const [trandingworksDom] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  leaveOnlyOneTabOpen('app.tradingworks.net', trandingworksDom.id);

  if(trandingworksDom.url.includes('app.tradingworks.net')){
    loadsTheExtensionForTheCurrentTab(trandingworksDom.id);
  }else{
    updateCurrentTableForTradingworks(trandingworksDom.id);
  }
});

function handleLinks(){
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      chrome.tabs.create({'url': link.href }, (tab) => { });
    });
  });
}

function handleButtonConfig(){
  const buttonConfig = document.getElementById('button-config');
  buttonConfig.addEventListener('click', openConfig);
}

function leaveOnlyOneTabOpen(url, tabId){
  chrome.tabs.query({}, function(tabs) { 
    tabs.forEach(tab => {
      if(tab.url.includes(url) && tab.id !== tabId) chrome.tabs.remove(tab.id, () => { });
    }); 
  });
}

function updateCurrentTableForTradingworks(tabId){
  chrome.tabs.update(tabId, {
    url: 'https://app.tradingworks.net/',
    pinned: true,
    selected: true
  });
}

function loadsTheExtensionForTheCurrentTab(tabId){
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['./assets/scripts/loadExtension.js']
  });

  handleLinks();
  handleButtonConfig();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === "popup_update") updateContent(document, request.data);

    sendResponse({ msg: "popup_update_success", config: window.localStorage.getItem('tradingworks-plus-data') });
  });
}