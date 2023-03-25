window.addEventListener('DOMContentLoaded', () => {
  checkSignedIn()
  loadWorkedHours();
  handleButtonConfig();
  sendSettingsToBackgroundScript();
});

document.getElementById('btn-login').addEventListener('click', redirectToLogin);

async function checkSignedIn() {
  const body = document.querySelector('body');
  const sectionSigned = document.getElementById('signed');
  const sectionNotSigned = document.getElementById('notsigned');

  const html = await getUpdatedHTML();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const isSignedIn = !doc.title.includes('Log In') ? true : false;
  if(isSignedIn){
    body.style.opacity = 1;
    sectionSigned.style.display = 'block';
    sectionNotSigned.style.display = 'none';

  }else{
    body.style.opacity = 1;
    sectionSigned.style.display = 'none';
    sectionNotSigned.style.display = 'block';
  }

}

function redirectToLogin(){
  chrome.tabs.create({
    url: "https://app.tradingworks.net/"
  });
}


function handleButtonConfig(){
  const buttonConfig = document.getElementById('button-config');
  buttonConfig.addEventListener('click', openConfig);
}

function sendSettingsToBackgroundScript(){
  const settings = localStorage.getItem('tradingworks-plus-data');
  chrome.runtime.sendMessage({tradingworksPlusExtension: true, settings});
}

async function getUpdatedHTML(){
  const response = await fetch("https://app.tradingworks.net/");
  return await response.text();
}