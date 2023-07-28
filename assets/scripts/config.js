window.addEventListener('DOMContentLoaded', () => {
  loadFormByData();
  handleSubmit();
  handleTimeInputs();
  handleButtonSendMessage();
  handleAllowSendMessageToggle();
  handleInputsBot();
});

function loadFormByData(){
  const form = document.querySelector('form');
  const data = JSON.parse(localStorage.getItem('tradingworks-plus-data'));
  if(data){
    form['work-time'].value = data['work-time'] || '';
    form['break-time'].value = data['break-time'] || '';
    form['whatsapp-number'].value = data['whatsapp-number'] || '';
    form['allow-send-messages-whatsapp'].checked = data['allow-send-messages-whatsapp'] === 'on';
    form['allow-send-messages-browser'].checked = data['allow-send-messages-browser'] === 'on';

    if(data['allow-send-messages-whatsapp'] !== 'on'){
      const number = document.querySelector('#whatsapp-number');

      [number].forEach(input => {
        input.classList.add('disabled');
        input.disabled = true;
      });
    }
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
      document.querySelector('form').classList.remove('invalid');
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

    notifications({
      whats: '🤖 *TW+:* Sistema configurado com sucesso! 🎉',
      browser: 'Sistema configurado com sucesso! 🎉',
    })

    const button = document.querySelector('button[type="submit"]');
    button.innerHTML = 'Sucesso! 🎉';

    setTimeout(() => {
      button.innerHTML = '💾 Salvar';
    }, 2000);
  });
}

function handleButtonSendMessage(){
  const button = document.querySelector('button#send-message');
  button.addEventListener('click', e => {
    e.preventDefault();
    
    notifications({
      browser: 'Olá!👋 Teste de notificações do TradingWorks+ no navegador. Por aqui está tudo certo. 🤗',
      whats: '🤖 *TW+:* Olá!👋 Esse é um teste de notificação no Whatsapp. Por aqui está tudo certo.'
    })
    chrome.runtime.sendMessage({tradingworksPlusExtension: true, sendMessage: true});
  });
}

async function notifications(messages){
  const number = document.querySelector('#whatsapp-number').value;
  const allowSendMessageWhatsapp = document.querySelector('#allow-send-messages-whatsapp')?.checked;
  const allowSendMessageBrowser = document.querySelector('#allow-send-messages-browser')?.checked;

  const optionsMessage = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: `{"number":"${number}","message":"${messages.whats}","token":"token"}`
  };

  if(!allowSendMessageBrowser && !allowSendMessageWhatsapp) alert('Nenhum canal de mensagem habilitado. 😢')

  if(allowSendMessageBrowser) await chrome.notifications.create(
    `trading-works-plus-msg-${new Date().getTime()}`, {
      type: "basic",
      iconUrl: "/assets/favicon48.png",
      title: "TradingWorks+",
      message: messages.browser,
    }, () => { }
  );

  if(allowSendMessageWhatsapp) {
    fetch('https://wppp-api-d0eaabc3aee0.herokuapp.com/send-message', optionsMessage)
      .then(response => response.json()).then(response => console.log(response))
      .catch(err => alert('Houve um erro ao enviar mensagem no whatsapp, verifique as informações e tente novamente. 😢', err));
  }
}

function handleAllowSendMessageToggle(){
  const toggle = document.querySelector('#allow-send-messages-whatsapp');
  toggle.addEventListener('change', e => {
    const number = document.querySelector('#whatsapp-number');

    [number].forEach(input => {
      input.classList.toggle('disabled');
      input.disabled = !input.disabled;
    });
  });
}

function handleInputsBot(){
  const number = document.querySelector('#whatsapp-number');

  [number].forEach(input => {
    input.addEventListener('keyup', e => {
      e.target.value = e.target.value.replace(/[^0-9]+/g, '');
    });
  });
}