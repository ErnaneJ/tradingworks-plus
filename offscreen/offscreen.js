const passTimeInStringToMinutes = (time) => {
  let [hour, minute] = time.split(':').map(v => parseInt(v));

  if (isNaN(hour)) hour = (new Date).getHours();
  if (isNaN(minute)) minute = (new Date).getMinutes();

  if (!minute) minute = 0;

  return (minute + (hour * 60));
}

class TWOffscreenNotifications {
  static async handleSentMessages(){
    console.log('[TradingWorks+] - Handle Sent Messages 🏗️');

    const config = JSON.parse(localStorage.getItem('tradingWorksSettings') || '{}');
    const data = JSON.parse(localStorage.getItem('tradingWorksPlusCalculatedData') || '{}');

    if(!config) return;

    const workTimeSettings = Math.floor(passTimeInStringToMinutes(config['work-time']));
    const breakTimeSettings = Math.floor(passTimeInStringToMinutes(config['break-time']));

    const realWorkTime = Math.floor(data.totalWorkedTime * 60);
    const realBreakTime = Math.floor(data.totalBreakTime * 60);
    
    const workTimeToFinish = Math.floor(workTimeSettings - realWorkTime);
    const breakTimeToFinish = Math.floor(breakTimeSettings - realBreakTime);

    // console.log({
    //   workTimeSettings,
    //   breakTimeSettings,
    //   realWorkTime,
    //   realBreakTime,
    //   workTimeToFinish,
    //   breakTimeToFinish
    // })

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
  
    setInterval(() => {
      console.log('[TradingWorks+] - Keep Alive 🏗️ - Offscreen');
      TWOffscreenNotifications.handleSentMessages();
      chrome.runtime.sendMessage({
        type: 'keepAlive',
        data: {}
      });
    }, 1000);
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

    chrome.runtime.sendMessage({
      type: 'updateWorkInformation',
      data: {
        points: points,
        timeBank: timeBank
      }
    });

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