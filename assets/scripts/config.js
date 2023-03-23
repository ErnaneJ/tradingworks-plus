window.addEventListener('DOMContentLoaded', () => {
  loadFormByData();
  handleSubmit();
});

function loadFormByData(){
  const form = document.querySelector('form');
  const data = JSON.parse(localStorage.getItem('tradingworks-plus-data'));
  if(data){
    form['work-time'].value = data['work-time'] || '';
    form['break-time'].value = data['break-time'] || '';
    form['whatsapp-number'].value = data['whatsapp-number'] || '';
    form['allow-send-messages'].checked = data['allow-send-messages'] === 'on';
    form['api-key'].value = data['api-key'] || '';
  }
}

let hoursInputs = document.querySelectorAll("#work-time, #break-time")

hoursInputs.forEach((input) => {
  input.addEventListener('blur', (event) => {
    const value = event.target.value.padStart(4, '0');
    const hours = value.slice(0, 2);
    const minutes = value.slice(2);


    if ((hours !== '00' && minutes > 59) || (hours == 24 && minutes > 00 || hours > 24)) {
      event.target.value = '00:00';
      alert('Horas inválidas!');
      return;
    }

    const formattedValue = value.includes(':') ? value : `${hours}:${minutes}`;
    event.target.value = formattedValue;
  });
});


function handleSubmit(){
  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const formatedData = Object.fromEntries(data.entries());

    localStorage.setItem('tradingworks-plus-data', JSON.stringify(formatedData));
    chrome.runtime.sendMessage({tradingworksPlusExtension: true, settings: JSON.stringify(formatedData)});

    const button = document.querySelector('button[type="submit"]');
    button.innerHTML = 'Sucesso! 🎉';

    setTimeout(() => {
      button.innerHTML = 'Salvar';
    }, 2000);
  });
}