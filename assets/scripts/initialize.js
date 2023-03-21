window.addEventListener('DOMContentLoaded', () => {
  updateWorkedHours();
  handleButtonConfig();
});

function handleButtonConfig(){
  const buttonConfig = document.getElementById('button-config');
  buttonConfig.addEventListener('click', openConfig);
}