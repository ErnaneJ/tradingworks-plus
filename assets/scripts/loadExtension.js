async function updateWorkedHours(){
  const informations = await chrome.storage.local.get('tradingworksPlusSharedData');
  
  updateContent(informations['tradingworksPlusSharedData']);

  setTimeout(updateWorkedHours, 60000);
}