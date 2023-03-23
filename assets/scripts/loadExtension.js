async function loadWorkedHours(){
  const informations = await chrome.storage.local.get('tradingworksPlusSharedData');
  
  updateContent(informations['tradingworksPlusSharedData']);

  setTimeout(loadWorkedHours, 60000);
}