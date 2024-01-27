class LoadExtension {
  constructor(popup) {
    this.popup = popup;
  }

  async load() {
    console.log('[TradingWorks+] - Load Extension 🏗️');
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace !== 'local') return;
      if (!changes['tradingWorksPlusWorkInformation']) return;
      
      this.popup.updateContent(changes['tradingWorksPlusWorkInformation'].newValue);
    });
    
    this.popup.updateContent((await chrome.storage.local.get('tradingWorksPlusWorkInformation'))?.tradingWorksPlusWorkInformation);
  }
}