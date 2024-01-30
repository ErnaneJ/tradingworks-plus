class LoadExtension {
  constructor(popup) {
    this.popup = popup;
  }

  async load() {
    console.log('[TradingWorks+] - Update Extension 🏗️');

    const { tradingWorksPlusWorkInformation } = await chrome.storage.local.get('tradingWorksPlusWorkInformation');
    this.popup.updateContent(tradingWorksPlusWorkInformation);

    setTimeout(() => this.load(), 1000);
  }
}