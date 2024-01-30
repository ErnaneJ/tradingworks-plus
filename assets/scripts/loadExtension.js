class LoadExtension {
  constructor(popup) {
    this.popup = popup;
  }

  async load() {
    console.log('[TradingWorks+] - Update Extension 🏗️');

    this.popup.updateContent();

    setTimeout(() => this.load(), 1000);
  }
}