class BackgroundHelper {
  static passTimeInStringToMinutes(time) {
    let [hour, minute] = time.split(':').map(v => parseInt(v));
  
    if (isNaN(hour)) hour = (new Date).getHours();
    if (isNaN(minute)) minute = (new Date).getMinutes();
  
    if (!minute) minute = 0;
  
    return (minute + (hour * 60));
  }
}
class Events {
  constructor(){}

  static debug(data){
    console.log('[TradingWorks+] - Debug received 🏗️');
    console.log(data);
  }

  static keepAlive(_){
    console.log('[TradingWorks+] - Keep Alive 🏗️ - Background');
  }

  static async updateSettings(data){
    console.log('[TradingWorks+] - UpdateSettings received 🏗️');
    await chrome.storage.local.set({settings: data});
  }

  static async updateWorkInformation(data){
    console.log('[TradingWorks+] - UpdateWorkInformation received 🏗️');
    await chrome.storage.local.set({'tradingWorksPlusWorkInformation': data});
  }

  static async updateScreen(data){
    console.log('[TradingWorks+] - UpdateScreen received 🏗️');
    try{
      await chrome.runtime.sendMessage({ setScreen: true, screen: data.screen });
      console.log('[TradingWorks+] - ⚠ Popup is open. Message to update the screen sent.')
    }catch(e){
      // console.log(e);
      console.log('[TradingWorks+] - ⚠ Popup is not open.')
    }
  }

  static async createOffscreen(){
    console.log('[TradingWorks+] - Create Offscreen received 🏗️');
    try {
      if (await chrome.offscreen.hasDocument?.()) return;
    
      await chrome.offscreen.createDocument({
        url: './offscreen/index.html',
        reasons: ['LOCAL_STORAGE'],
        justification: 'keep service worker running',
      });
    } catch (error) {
      console.error("Erro ao usar a API Offscreen:", error);
    }
  }

  static async chromeNotify(data){
    console.log('[TradingWorks+] - Chrome Notify received 🏗️');
    await chrome.notifications.create(data.id, {
      type: 'basic',
      iconUrl: "../favicon48.png",
      title: data.title,
      message: data.message,
    });
  }

  static whatsNotify(data){
    console.log('[TradingWorks+] - Whats Notify received 🏗️');
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

  chromeRuntimeOnMessage(){
    console.log('[TradingWorks+] - Chrome Runtime On Message 🏗️');

    try{
      chrome.runtime.onInstalled.addListener(async (port) => {
        console.log('[TradingWorks+] - Chrome Runtime On Installed 🏗️');
        await Events.createOffscreen()
      });
      chrome.runtime.onConnect.addListener(async (port) => {
        console.log('[TradingWorks+] - Chrome Runtime On Connect 🏗️');
        await chrome.offscreen.closeDocument()
        await Events.createOffscreen();
        console.log("opa")
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
