const port = chrome.runtime.connect({ name: "extensionOpen" });

class Application {
  constructor(){
    const popup = new Popup();
    const extension = new LoadExtension(popup);

    extension.load();

    this.initialize();
  }

  initialize(){
    this.#handleButtonConfig();
    this.#sendSettingsToBackgroundScript();
    this.#chromeRuntimeOnMessage();
  }

  #handleButtonConfig(){
    const buttonConfig = document.getElementById('button-config');
    if(!buttonConfig) return;

    buttonConfig.addEventListener('click', PopupHelper.openConfig);
  }

  #sendSettingsToBackgroundScript(){
    const settings = localStorage.getItem('tradingWorksSettings');
    chrome.runtime.sendMessage({type: 'updateSettings', data: JSON.parse(settings)});
  }

  #chromeRuntimeOnMessage(){
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type !== "changeScreen") return;
      
      this.setScreen(message.data.screen);
    });
  }

  setScreen(screen){
    const screens = [
      'loading', // Information are being loaded
      'started', // User is signed in and working
      'not-started' // User is signed in but not working
    ];
    
    screens.forEach((screenType) => {
      const section = document.getElementById(screenType + '-screen');
      
      section.style.display = 'none';
  
      if(screenType === screen){
        section.style.display = 'flex';
      }
    });
  }
}