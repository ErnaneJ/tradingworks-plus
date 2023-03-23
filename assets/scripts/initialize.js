window.addEventListener('DOMContentLoaded', () => {
  loadWorkedHours();
  handleButtonConfig();
  sendSettingsToBackgroundScript();
});

function handleButtonConfig(){
  const buttonConfig = document.getElementById('button-config');
  buttonConfig.addEventListener('click', openConfig);
}

function handleButtonRefresh(){
  const buttonRefresh = document.getElementById('button-refresh');
  buttonRefresh.addEventListener('click', () => {
    console.log('working')
  });
}

function sendSettingsToBackgroundScript(){
  const settings = localStorage.getItem('tradingworks-plus-data');
  chrome.runtime.sendMessage({tradingworksPlusExtension: true, settings});
}