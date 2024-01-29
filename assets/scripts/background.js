class BackgroundMessages {

}
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

  static chromeNotify(data){
    chrome.notifications.create(data.id, {
      type: 'basic',
      iconUrl: "../favicon48.png",
      title: data.title,
      message: data.message,
    });
  }

  static whatsNotify(data){
    const options = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: `{"number":"${data.number}","message":"${data.message}","token":"3967f4a6-3cd3-4ded-b08e-3fcbf3dbf6a9"}`
    };
    
    fetch('https://buddy.ernane.dev/api/v1/send-message/', options)
      .then(response => response.json())
      .then(response => {})
      .catch(err => console.log('Erro ao enviar mensagem! 😢', err));
  }
}

class Background {
  constructor(){
    console.log('[TradingWorks+] - Background 🏗️');
    this.chromeRuntimeOnMessage();
  };

  keepAlive(){
    setInterval(() => chrome.runtime.sendMessage({ type: 'keepAlive', data: {} }), 1000);
  }

  chromeRuntimeOnMessage(){
    console.log('[TradingWorks+] - Chrome Runtime On Message 🏗️');

    try{
      chrome.runtime.onStartup.addListener(Events.createOffscreen);
      chrome.runtime.onInstalled.addListener(Events.createOffscreen);
      chrome.runtime.onConnect.addListener((port) => {
        chrome.offscreen.closeDocument()
        Events.createOffscreen();
      });
  
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        const events = {
          debug: Events.debug,
          keepAlive: Events.keepAlive,
          updateSettings: Events.updateSettings,
          updateWorkInformation: Events.updateWorkInformation,
          changeScreen: Events.updateScreen,
          chromeNotify: Events.chromeNotify,
          whatsNotify: Events.whatsNotify,
        };
  
        return events[message.type]?.(message.data);
      });
    }catch(e){
      console.log(e);
    }
  }
}

new Background();
