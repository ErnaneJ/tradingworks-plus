window.addEventListener('DOMContentLoaded', () => {
  loadWorkedHours();
  handleButtonConfig();
  sendSettingsToBackgroundScript();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.setScreen) setScreen(request.screen);
  });
});

function handleButtonConfig(){
  const buttonConfig = document.getElementById('button-config');
  buttonConfig.addEventListener('click', openConfig);
}

function sendSettingsToBackgroundScript(){
  const settings = localStorage.getItem('tradingworks-plus-data');
  chrome.runtime.sendMessage({tradingworksPlusExtension: true, settings});
}

function setScreen(screen){
  const screens = [
    'loading', // Informations are being loaded
    'not-signed-in', // User is not signed in
    'started', // User is signed in and working
    'not-started' // User is signed in but not working
  ];
  
  screens.forEach((screenType) => {
    const section = document.getElementById(screenType + '-screen');
    
    section.style.display = 'flex';
    section.style.opacity = 1;

    if(screenType !== screen){
      section.style.opacity = 0;
      section.style.display = 'none';
    }
  });
}