class OffscreenHelper {
  static calculateInformation(data){
    const points = OffscreenHelper.calculatePoints(data.points);
    const timeBank = data.timeBank;
    const totalWorkedTime = points.reduce((acc, cur) => acc + cur.duration, 0);
    const isWorking = points.length > 0 && !points.slice(-1)[0]?.endDate;
    
    const [exceededCurrentBreakTime, currentBreakTime] = OffscreenHelper.calculateCurrentBreakTime(points, isWorking, totalWorkedTime);
    const totalBreakTime = points.reduce((acc, cur) => acc + (cur.interval ? cur.interval : 0), 0) + (currentBreakTime || 0);
  
    return {
      isWorking: isWorking,
      timeBank: timeBank,
      points: points,
      totalWorkedTime: totalWorkedTime,
      totalBreakTime: totalBreakTime,
      exceededCurrentBreakTime: exceededCurrentBreakTime,
      currentBreakTime: currentBreakTime,
    }
  }

  static calculateCurrentBreakTime(points, isWorking, totalWorkedTime){
    const config = JSON.parse(window.localStorage.getItem('tradingWorksSettings'));

    const workTimeSettings = OffscreenHelper.passTimeInStringToHours(config['work-time']);
    
    if(isWorking || totalWorkedTime >= workTimeSettings) return [];

    const lastWorkedTimeEnd = points.slice(-1)[0]?.endDate;

    if(!lastWorkedTimeEnd) return [];

    const currentBreakTime = OffscreenHelper.calculateDiffDates(new Date(lastWorkedTimeEnd), new Date());
    const breakInformedTime = OffscreenHelper.passTimeInStringToHours(config['break-time']);
    const exceededBreakTime = currentBreakTime >= breakInformedTime;

    return [exceededBreakTime, currentBreakTime];
  }

  static calculatePoints(points) {
    return points.map((point, index, array) => {
      if (index % 2 !== 0) return;
  
      const start = point;
      const end = array[index + 1];
      const nextPoint = array[index + 2];
  
      return {
        startDate: start?.eventDateTime,
        endDate: end?.eventDateTime,
        manualStartDate: !!(start?.workerReason),
        manualEndDate: !!(end?.workerReason),
        duration: OffscreenHelper.calculateDiffDates(start?.eventDateTime, end?.eventDateTime),
        interval: OffscreenHelper.calculateInterval(end?.eventDateTime, nextPoint?.eventDateTime, points.length)
      };
    }).filter(Boolean);
  }

  static calculateInterval(currentPointDate, nextPointDate, pointsLength){
    if(!nextPointDate) return;

    return OffscreenHelper.calculateDiffDates(currentPointDate, nextPointDate ? nextPointDate : new Date())
  }

  static calculateDiffDates(date1, date2) {
    try {
      date1 = new Date(date1);
      date2 = date2 ? new Date(date2) : new Date();
      return (date2 - date1) / 3.6e+6;
    } catch (e) {
      return 0;
    }
  }

  static passTimeInStringToHours(time) {
    let [hour, minute] = time.split(':').map(v => parseInt(v));
  
    if (isNaN(hour)) hour = (new Date).getHours();
    if (isNaN(minute)) minute = (new Date).getMinutes();
  
    if (!minute) minute = 0;
  
    return (minute + (hour * 60)) / 60;
  }

  static passTimeInStringToMinutes = (time) => {
    let [hour, minute] = time.split(':').map(v => parseInt(v));
  
    if (isNaN(hour)) hour = (new Date).getHours();
    if (isNaN(minute)) minute = (new Date).getMinutes();
  
    if (!minute) minute = 0;
  
    return (minute + (hour * 60));
  }
}

class TWOffscreenNotifications {
  static async handleSentMessages(data){
    console.log('[TradingWorks+] - Offscreen Handle Sent Messages 🏗️');

    const config = JSON.parse(localStorage.getItem('tradingWorksSettings') || '{}');

    if(!config) return;

    const workTimeSettings = Math.floor(OffscreenHelper.passTimeInStringToMinutes(config['work-time']));
    const breakTimeSettings = Math.floor(OffscreenHelper.passTimeInStringToMinutes(config['break-time']));

    const realWorkTime = Math.floor(data.totalWorkedTime * 60);
    const realBreakTime = Math.floor(data.totalBreakTime * 60);
    
    const workTimeToFinish = Math.floor(workTimeSettings - realWorkTime);
    const breakTimeToFinish = Math.floor(breakTimeSettings - realBreakTime);

    console.table({
      workTimeSettings,
      breakTimeSettings,
      realWorkTime,
      realBreakTime,
      workTimeToFinish,
      breakTimeToFinish
    })

    if(realWorkTime >= 1) TWOffscreenNotifications.notify(config, "🤖 *TW+:* Sensacional! Vamos começar? 🚀", "msg-0");
    if(realBreakTime >= 1) TWOffscreenNotifications.notify(config, "🤖 *TW+:* Intervalo iniciado, aproveite! 🚀", "msg-1");

    if(workTimeToFinish <= (workTimeSettings / 2)) TWOffscreenNotifications.notify(config, "🤖 *TW+:* Que incrível! Já estamos na metade do *expediente* de hoje! 🚀", "msg-2");
    if((workTimeToFinish <= (breakTimeSettings + 5)) && (realBreakTime == 0)) TWOffscreenNotifications.notify(config, "🤖 *TW+:* Opa! Não esqueça do intervalo! 🚀", "msg-3");
    if(workTimeToFinish <= 60)   TWOffscreenNotifications.notify(config, "🤖 *TW+:* Falta apenas 1 hora para o fim do *expediente* de hoje! ⌛", "msg-4");
    if(workTimeToFinish <= 30)   TWOffscreenNotifications.notify(config, "🤖 *TW+:* Faltam apenas 30 minutos para o fim do *expediente* de hoje. ⌛", "msg-6");
    if(workTimeToFinish <= 15)   TWOffscreenNotifications.notify(config, "🤖 *TW+:* Faltam apenas 15 minutos para o fim do *expediente* de hoje. ⌛", "msg-7");
    if(workTimeToFinish <= 1)    TWOffscreenNotifications.notify(config, "🤖 *TW+:* Falta apenas 1 minuto para o fim do *expediente* de hoje. ⌛", "msg-8");
    if(workTimeToFinish <= 0)    TWOffscreenNotifications.notify(config, "🤖 *TW+:* Fim do *expediente*! Não esquece de bater o ponto! Até mais. 👋", "msg-9");
    if(workTimeToFinish <= -5)   TWOffscreenNotifications.notify(config, "🤖 *TW+:* Ei! O expediente já acabou fazem 5 minutos e você ainda não bateu o ponto. 🚨", "msg-10");
    if(workTimeToFinish <= -30)  TWOffscreenNotifications.notify(config, "🤖 *TW+:* Que incrível! Já foram 30 minutos de hora extra.", "msg-11");
    if(workTimeToFinish <= -60)  TWOffscreenNotifications.notify(config, "🤖 *TW+:* Wow, 1 hora extra contabilizada. Você está demais!", "msg-12");
    if(workTimeToFinish <= -120) TWOffscreenNotifications.notify(config, "🤖 *TW+:* Você já fez duas horas extras. Cuidado para não exceder o limite! Vamos descansar e voltamos para finalizar outro dia. Hoje foi incrível! 🤯\n\n_Não notificarei mais a partir daqui, você está por sua conta em risco agora. Fique atento!_ 🚨", "msg-13");

    if(breakTimeToFinish <= 15)  TWOffscreenNotifications.notify(config, "🤖 *TW+:* Faltam apenas 15 minutos para o fim do *intervalo*. ⌛", "msg-14");
    if(breakTimeToFinish <= 1)   TWOffscreenNotifications.notify(config, "🤖 *TW+:* Falta apenas 1 minuto para o fim do *intervalo*. ⌛", "msg-15");
    if(breakTimeToFinish <= 0)   TWOffscreenNotifications.notify(config, "🤖 *TW+:* Fim do *intervalo*! Não esquece de bater o ponto! Até mais. 👋", "msg-16");
    if(breakTimeToFinish <= -5)  TWOffscreenNotifications.notify(config, "🤖 *TW+:* Ei! O intervalo já acabou fazem 5 minutos e você ainda não voltou. 🚨", "msg-16");
  }

  static async notify(config, msg, idMsg){
    let msgsData = JSON.parse(localStorage.getItem('two-messages') || '{}');
    const currentDate = new Date().toLocaleString('pt-BR', { day: 'numeric', month: 'numeric', year: 'numeric' });

    if(msgsData.date !== currentDate) msgsData = {
      date: currentDate,
      msgsIds: []
    };
    
    if(msgsData.msgsIds.includes(idMsg)) return;
      
    msgsData.msgsIds.push(idMsg);

    if(config && config['allow-send-messages-browser'] === 'on'){
      chrome.runtime.sendMessage({
        type: 'chromeNotify',
        data: {
          id: `trading-works-plus-msg-${(new Date()).getTime()}`,
          type: "basic",
          title: "TradingWorks+",
          message: msg.replaceAll('*', ''),
        }
      });
    }
  
    if(config && config['allow-send-messages-whatsapp'] === 'on'){    
      chrome.runtime.sendMessage({
        type: 'whatsNotify',
        data: {
          number: config['whatsapp-number'],
          message: msg
        }
      });
    }

    localStorage.setItem('two-messages', JSON.stringify(msgsData)); 
  }
}
class TWOffscreen {
  TRADING_WORKS_POINTS_API = 'https://api-main.tworh.com.br/api/attendanceregister/list';
  TRADING_WORKS_TIME_BANK_API = 'https://api-main.tworh.com.br/api/CompTimeEvent/list';

  constructor() {
    this.#updateTradingWorksData();
  }

  get configurations() {
    try {
      return JSON.parse(localStorage.getItem('tradingWorksSettings'));
    } catch (e) {
      return null;
    }
  }

  get user(){
    try{
      return JSON.parse(localStorage.getItem('tradingWorksUser'));
    }catch(e){
      return null;
    }
  }

  async #fetchUserPoints(employeeid, companyid) {
    if (!employeeid || !companyid) return null;

    try {
      // ?CompanyId=<0000>&EmployeeId=<00000>&BaseDate=<YYYY-MM-DDT20%3A08%3A39.4527475>
      const currentDate = new Date();
      const baseDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
      const URL = `${this.TRADING_WORKS_POINTS_API}?CompanyId=${companyid}&EmployeeId=${employeeid}&BaseDate=${baseDate}`;
      const rawData = await fetch(URL, {method: 'GET'});

      return await rawData.json();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async #fetchTimeBank(employeeid, companyid) {
    if (!employeeid || !companyid) return null;

    // ?EmployeeId=<00000>&CompanyId=<0000>&ViewHistory=false
    try {
      const URL = `${this.TRADING_WORKS_TIME_BANK_API}?EmployeeId=${employeeid}&CompanyId=${companyid}&ViewHistory=false`;
      const rawData = await fetch(URL, {method: 'GET'});

      return await rawData.json();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async #updateTradingWorksData() {
    this.#setScreen('loading');

    const user = this.user;

    if (!user){
      this.#setScreen('not-started');
      return null;
    };

    const userPoints = await this.#fetchUserPoints(user.employeeid, user.companyid);
    const userTimeBank = await this.#fetchTimeBank(user.employeeid, user.companyid);

    if (!userPoints || !userTimeBank){
      this.#setScreen('not-started');
      return null;
    };

    this.#setScreen('started');

    const timeBank = userTimeBank.listResponse.map(el => el.compTime).reduce((acc, cur) => acc + cur, 0);
    const points = userPoints.listResponse;

    // points.pop();
    // points.pop();
    // points.pop();
    // points.pop();

    const data = OffscreenHelper.calculateInformation({ points, timeBank });
    TWOffscreenNotifications.handleSentMessages(data);

    localStorage.setItem('tradingWorksPlusCalculatedData', JSON.stringify(data));

    setTimeout(async () => await this.#updateTradingWorksData(), 60000);
  }

  #setScreen(screen) {
    chrome.runtime.sendMessage({
      type: 'changeScreen',
      data: { screen: screen }
    });
  }
}

new TWOffscreen();