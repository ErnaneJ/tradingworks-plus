chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.debug) console.log(message.data);

  if (message.keepAlive) console.log('keepAlive');
  if (message.tradingworksPlusExtension) await chrome.storage.local.set({settings: message.settings});
  if (message.workInformations) updateWorkInformations(message.informations);

  if(message.changeScreen) chrome.runtime.sendMessage({ setScreen: true, screen: message.screen }).catch(() => { });
  
  return true;
});

async function createOffscreen() {
  if (await chrome.offscreen.hasDocument?.()) return;

  await chrome.offscreen.createDocument({
    url: './offscreen/index.html',
    reasons: ['BLOBS'],
    justification: 'keep service worker running',
  });
}

chrome.runtime.onStartup.addListener(createOffscreen);
chrome.runtime.onInstalled.addListener(createOffscreen);
chrome.runtime.onConnect.addListener(async(port) => {
  await chrome.offscreen.closeDocument()
  await createOffscreen();
});

async function updateWorkInformations(informations){
  await chrome.storage.local.set({'tradingworksPlusSharedData': informations});
  handleSentMessages(informations);
}

async function handleSentMessages(data){
  const config = JSON.parse((await chrome.storage.local.get('settings') || {}).settings);

  if(!config) return;

  const minutesToFinish = passTimeInStringToMinutes(config['work-time']) - data.totalWorkedTime;
  const breakTimeParsed = passTimeInStringToMinutes(config['break-time']);

  if(data.totalWorkedTime <= 10) sendMsg(config, "🤖 *TW+:* Aee! Pronto para mais um dia de trabalho? Vamos nessa! Não se preocupa que eu estou de olho no ponto. 😎", "msg-0");

  if(breakTimeParsed === data.totalBreakTime) sendMsg(config, "🤖 *TW+:* Intervalo finalizado, hora de voltar! 🚀", "msg-1");

  if(minutesToFinish === 60) sendMsg(config, "🤖 *TW+:* Opa! Faltam apenas 1 hora para o fim do expediente. 🎉", "msg-2");
  if(minutesToFinish === 15) sendMsg(config, "🤖 *TW+:* Fica ligeiro. Faltam apenas 15 minutos para o fim do expediente. ⌛", "msg-3");
  if(minutesToFinish === 1)  sendMsg(config, "🤖 *TW+:* Faltam apenas 1 minuto, se prepara... ⌚", "msg-4");
  if(minutesToFinish === 0)  sendMsg(config, "🤖 *TW+:* Fim do dia! Não esquece de bater o ponto! Até mais. 👋", "msg-5");
}

async function sendMsg(config, msg, idMsg){
  let msgHandle = (await chrome.storage.local.get('message-handle'))['message-handle'] || {};
  const currentDate = getCurrentUTCDate();
  if(msgHandle[idMsg] === currentDate)  return; // message already sent

  if(config && config['allow-send-messages-browser'] === 'on'){
    chrome.notifications.create(
      `trading-works-plus-msg-${new Date().getTime()}`, {
        type: "basic",
        iconUrl: "../favicon48.png",
        title: "TradingWorks+",
        message: msg.replaceAll('*', ''),
      }, () => { }
    );
  }

  if(config && config['allow-send-messages-whatsapp'] === 'on'){    
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: `{"number":"${config['whatsapp-number']}","message":"${msg}","token":"token"}`
    };
    
    fetch('https://wppp-api-d0eaabc3aee0.herokuapp.com/send-message', options)
      .then(response => response.json())
      .then(response => console.log(response))
      .catch(err => console.log('Erro ao enviar mensagem! 😢', err));
  }

  if(msgHandle) msgHandle[idMsg] = currentDate;
  await chrome.storage.local.set({'message-handle': msgHandle});
}

function passTimeInStringToMinutes(time){
  let [hour, minute] = time.split(':').map(v => parseInt(v));
  
  if(isNaN(hour)) hour = (new Date).getHours();
  if(isNaN(minute)) minute = (new Date).getMinutes();
  
  if(!minute) minute = 0;
  
  return minute + (hour * 60);
}

function getCurrentUTCDate() {
  const currentDate = new Date();
  const utcDate = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000);
  return utcDate.toISOString().slice(0, 10);
}