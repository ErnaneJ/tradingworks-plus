async function loadWorkedHours(){
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    if (!changes['tradingworksPlusSharedData']) return;
    
    updateContent(changes['tradingworksPlusSharedData'].newValue);
  });
  
  const informations = await chrome.storage.local.get('tradingworksPlusSharedData');
  updateContent(informations['tradingworksPlusSharedData']);

  setTimeout(loadWorkedHours, 60000);
}