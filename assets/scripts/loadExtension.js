class LoadExtension {
  constructor(popup) {
    this.popup = popup;
  }

  async load() {
    console.log('[TradingWorks+] - Load Extension 🏗️');
    
    setInterval(async () => {
      this.popup.updateContent(
        (await chrome.storage.local.get('tradingWorksPlusWorkInformation'))?.tradingWorksPlusWorkInformation
      );
    }, 1000);
  }
}