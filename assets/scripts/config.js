window.addEventListener('DOMContentLoaded', () => {
  loadFormByData();
  handleSubmit();
  handleTimeInputs()
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

function handleTimeInputs(){
  let hoursInputs = document.querySelectorAll("#work-time, #break-time")

  const format = event => {
    let value = event.target.value
  
    value = value.replace(/[a-zA-Z\:]/g, '');
    console.log(value)
    value = value.padStart(4, '0');

    if (event.key === 'Backspace') {
      event.preventDefault();
      value = value.substring(0, value.length);
      value = value.padStart(4, '0');
    } else if("1234567890".includes(event.key)){
      value = value.substring(1);
      value = value.padEnd(4, '0');
    } else{
      event.preventDefault();
    }

    event.target.value = value.replace(/(\d{2})(\d{2})/, '$1:$2');

    const hours = parseInt(event.target.value.split(':')[0]);
    const minutes = parseInt(event.target.value.split(':')[1]);

    if(hours > 23 || minutes > 59) {
      document.querySelector('form').classList.add('invalid');
      event.target.style.outline = '2px solid #db4444';
    }else{
      event.target.style.outline = 'initial';
    }
  }

  hoursInputs.forEach((input) => {
    input.addEventListener('keyup', format);
  });
}

function handleSubmit(){
  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if(event.target.classList.contains('invalid')) return alert('Erro ao salvar. Verifique as informações e tente novamente. 😢');

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