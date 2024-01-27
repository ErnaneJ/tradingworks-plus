class Events {
  constructor(){}

  static debug(data){
    console.log(data);
  }

  static keepAlive(_){
    console.log('[TradingWorks+] - Keep Alive 🏗️');
  }

  static async updateSettings(data){
    chrome.storage.local.set({settings: data});
  }

  static async updateWorkInformation(data){
    await chrome.storage.local.set({'tradingWorksPlusWorkInformation': data});
    Events.handleSentMessages(data);
  }

  static async updateScreen(data){
    await chrome.runtime.sendMessage({ setScreen: true, screen: data.screen });
  }

  static async createOffscreen(){
    if (await chrome.offscreen.hasDocument?.()) return;

    await chrome.offscreen.createDocument({
      url: './offscreen/index.html',
      reasons: ['BLOBS'],
      justification: 'keep service worker running',
    });
  }

  static async handleSentMessages(data){
    // const config = JSON.parse((await chrome.storage.local.get('settings') || {}).settings);

    // if(!config) return;

    // const minutesToFinish = passTimeInStringToMinutes(config['work-time']) - data.totalWorkedTime;
    // const breakTimeParsed = passTimeInStringToMinutes(config['break-time']);

    // if(data.totalWorkedTime <= 10) sendMsg(config, "🤖 *TW+:* Aee! Pronto para mais um dia de trabalho? Vamos nessa! Não se preocupa que eu estou de olho no ponto. 😎", "msg-0");

    // if(breakTimeParsed === data.totalBreakTime) sendMsg(config, "🤖 *TW+:* Intervalo finalizado, hora de voltar! 🚀", "msg-1");

    // if(minutesToFinish === 60) sendMsg(config, "🤖 *TW+:* Opa! Faltam apenas 1 hora para o fim do expediente. 🎉", "msg-2");
    // if(minutesToFinish === 15) sendMsg(config, "🤖 *TW+:* Fica ligeiro. Faltam apenas 15 minutos para o fim do expediente. ⌛", "msg-3");
    // if(minutesToFinish === 1)  sendMsg(config, "🤖 *TW+:* Faltam apenas 1 minuto, se prepara... ⌚", "msg-4");
    // if(minutesToFinish === 0)  sendMsg(config, "🤖 *TW+:* Fim do dia! Não esquece de bater o ponto! Até mais. 👋", "msg-5");
  }

  static async sendMsg(config, msg, idMsg){
    // let msgHandle = (await chrome.storage.local.get('message-handle'))['message-handle'] || {};
    // const currentDate = getCurrentUTCDate();
    // if(msgHandle[idMsg] === currentDate)  return; // message already sent
  
    // if(config && config['allow-send-messages-browser'] === 'on'){
    //   chrome.notifications.create(
    //     `trading-works-plus-msg-${new Date().getTime()}`, {
    //       type: "basic",
    //       iconUrl: "../favicon48.png",
    //       title: "TradingWorks+",
    //       message: msg.replaceAll('*', ''),
    //     }, () => { }
    //   );
    // }
  
    // if(config && config['allow-send-messages-whatsapp'] === 'on'){    
    //   const options = {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: `{"number":"${config['whatsapp-number']}","message":"${msg}","token":"3967f4a6-3cd3-4ded-b08e-3fcbf3dbf6a9"}`
    //   };
      
    //   fetch('https://buddy.ernane.dev/api/v1/send-message/', options)
    //     .then(response => response.json())
    //     .then(response => console.log(response))
    //     .catch(err => console.log('Erro ao enviar mensagem! 😢', err));
    // }
  
    // if(msgHandle) msgHandle[idMsg] = currentDate;
    // await chrome.storage.local.set({'message-handle': msgHandle});
  }
}

class Background {
  constructor(){
    this.chromeRuntimeOnMessage();
  };

  chromeRuntimeOnMessage(){
    chrome.runtime.onStartup.addListener(Events.createOffscreen);
    chrome.runtime.onInstalled.addListener(Events.createOffscreen);
    chrome.runtime.onConnect.addListener(async (port) => {
      await chrome.offscreen.closeDocument()
      await Events.createOffscreen();
    });

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      const events = {
        debug: Events.debug,
        keepAlive: Events.keepAlive,
        updateSettings: Events.updateSettings,
        updateWorkInformation: Events.updateWorkInformation,
        changeScreen: Events.updateScreen,
      };

      await events[message.type]?.(message.data);
    });
  }
}

new Background();
