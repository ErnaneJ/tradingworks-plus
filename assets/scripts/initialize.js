window.addEventListener('DOMContentLoaded', () => {
  handleLinks();
  updateWorkedHours();
  handleButtonConfig();
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