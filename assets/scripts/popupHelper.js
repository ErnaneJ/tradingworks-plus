class PopupHelper {
  static formatBalance(balance) {
    const balanceHours = String(Math.round(balance)).padStart(2, '0');
    const balanceMinutes = String(Math.abs(Math.round((balance % 1) * 60))).padStart(2, '0');
    return `${balanceHours}h${balanceMinutes}m`;
  }

  static formatDate(date, format) {
    if (!date) return '-:-';
    if (typeof date !== 'object') date = new Date(date);
    const map = {
      mm: String(date.getMonth() + 1).padStart(2, '0'),
      dd: String(date.getDate()).padStart(2, '0'),
      aa: String(date.getFullYear().toString().slice(-2)).padStart(2, '0'),
      aaaa: String(date.getFullYear()).padStart(2, '0'),
      hh: String(date.getHours()).padStart(2, '0'),
      min: String(date.getMinutes()).padStart(2, '0'),
      ss: String(date.getSeconds()).padStart(2, '0'),
      MM: date.toLocaleString('default', { month: 'long' })
    }
  
    return format.replace(/mm|dd|aa|aaaa|MM|hh|min|ss/gi, matched => map[matched])
  }

  static passTimeInStringToHours(time) {
    let [hour, minute] = time.split(':').map(v => parseInt(v));
  
    if (isNaN(hour)) hour = (new Date).getHours();
    if (isNaN(minute)) minute = (new Date).getMinutes();
  
    if (!minute) minute = 0;
  
    return (minute + (hour * 60)) / 60;
  }

  static openConfig() {
    chrome.tabs.create({ 'url': chrome.runtime.getURL('./config/index.html') }, (tab) => { });
  }

  static checkConfig(config) {
    if (config && config['work-time'] && config['break-time']) return;
    PopupHelper.openConfig();
    window.close();
  }
}