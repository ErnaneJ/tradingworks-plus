class PopupHelper {
  static calculateInformation(data){
    const points = PopupHelper.calculatePoints(data.points);
    const timeBank = data.timeBank;
    const totalWorkedTime = points.reduce((acc, cur) => acc + cur.duration, 0);
    const totalBreakTime = points.reduce((acc, cur) => acc + (cur.interval ? cur.interval : 0), 0);
  
    return {
      isWorking: !points.slice(-1)[0].endDate,
      timeBank: timeBank,
      points: points,
      totalWorkedTime: totalWorkedTime,
      totalBreakTime: totalBreakTime,
    }
  }

  static calculatePoints(points) {
    return points.map((point, index, array) => {
      if (index % 2 !== 0) return;
  
      const start = point;
      const end = array[index + 1];
      const nextPoint = array[index + 2];
  
      return {
        startDate: start.createDate,
        endDate: end.createDate,
        duration: PopupHelper.calculateDiffDates(start.createDate, end.createDate),
        interval: PopupHelper.calculateInterval(end, nextPoint)
      };
    }).filter(Boolean);
  }

  static calculateInterval(currentPoint, nextPoint){
    if(!nextPoint) return;

    return PopupHelper.calculateDiffDates(currentPoint.createDate, nextPoint.createDate)
  }

  static calculateDiffDates(date1, date2) {
    try {
      return (new Date(date2) - new Date(date1)) / 3.6e+6;
    } catch (e) {
      return 0;
    }
  }

  static formatBalance(balance) {
    const balanceHours = String(Math.floor(balance)).padStart(2, '0');
    const balanceMinutes = String(Math.round((balance % 1) * 60)).padStart(2, '0');
    return `${balanceHours}h${balanceMinutes}m`;
  }

  static formatDate(date, format) {
    if (!date) return '-:-';
    if (typeof date === 'string') date = new Date(date);
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