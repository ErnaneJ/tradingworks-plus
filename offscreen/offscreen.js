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
      const start = new Date();
      start.setHours(Number(point.start.split(':')[0]));
      start.setMinutes(Number(point.start.split(':')[1]));

      let end = null;
      if(point.end){
        end = new Date();
        end.setHours(Number(point.end.split(':')[0]));
        end.setMinutes(Number(point.end.split(':')[1]));
      }else{
        point.compTime = OffscreenHelper.calculateInterval(start, new Date(), points.length) * 60;
      }

      const nextPointStart = new Date();
      nextPointStart.setHours(Number(array[index + 1]?.start.split(':')[0]));
      nextPointStart.setMinutes(Number(array[index + 1]?.start.split(':')[1]));
  
      return {
        startDate: start,
        endDate: end,
        duration: point.compTime/60 || 0,
        interval: array[index + 1] ? OffscreenHelper.calculateInterval(end, nextPointStart, points.length) : 0,
        ...point
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

    // console.table({
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
  constructor() {
    this.#updateTradingWorksData();
  }

  async #fetchUserPoints() {
    try {
      const request = fetch("https://app.tradingworks.net/Attendances/ClockInOut.aspx");
      const rawHtml = await request.then(res => res.text());

      const parser = new DOMParser();
      const document = parser.parseFromString(rawHtml, 'text/html');

      const table = document.querySelector('.container table');
      if(!table) return null;

      let cells = table.getElementsByTagName('td');
      let textContent = '';
      let colors = [];
      for (let cell of cells) {
        let icon = cell.querySelector('i');
        if(icon) colors.push(icon?.style.color || '');
        textContent += cell.textContent + ' ';
      }

      const rawPoints = textContent.match(/\b\d{2}:\d{2}\b/g);
      const points = [];

      // rawPoints.pop();
      // rawPoints.pop();
      // rawPoints.pop();
      // rawPoints.pop();
      
      for (let i = 0; i < rawPoints.length; i += 3) {
        let compTime = 0;
        if(rawPoints[i + 2]){
          const [compTimeHours, compTimeMinutes] = rawPoints[i + 2].split(':').map(Number);
          compTime = compTimeHours * 60 + compTimeMinutes;
        }

        points.push({
          start: rawPoints[i],
          startColor: null,
          end: rawPoints[i + 1],
          endColor: null,
          compTime: compTime,
          compTimeString: rawPoints[i + 2]
        });
      }

      points.forEach((point, index) => {
        if(point.start) point.startColor = colors[index * 2];
        if(point.end) point.endColor = colors[(index * 2) + 1];
      });

      return points;
    } catch (e) {
      // console.log(e);
      return null;
    }
  }

  async #fetchTimeBank() {
    try {
      const request = fetch("https://app.tradingworks.net/Payroll/MyTimeCards.aspx");
      const rawHtml = await request.then(res => res.text());

      const parser = new DOMParser();
      const document = parser.parseFromString(rawHtml, 'text/html');

      const bodyBalance = document.getElementById('Body_Body_lblBalance');
      if(!bodyBalance) return null;

      const bh = bodyBalance.innerText.match(/\b\d{2}:\d{2}\b/g);
      if(!bh[0]) return null;

      const [hours, minutes] = bh[0].split(':').map(Number);

      return (hours * 60 + minutes) * (bodyBalance.innerText.includes('-') ? -1 : 1);
    } catch (e) {
      // console.log(e);
      return null;
    }
  }

  async #fetchExtraSettings(){
    const extraSettings = {};

    const getCurrentMonthAppointments = async () => {
      const request = fetch("https://app.tradingworks.net/Attendances/ListAttendances.aspx");
      const rawHtml = await request.then(res => res.text());

      
      const parser = new DOMParser();
      const document = parser.parseFromString(rawHtml, 'text/html');

      const table = document.querySelector('table[data-filename="TWO - Apontamentos"]');
      const headers = [];
      const data = [];

      const headerElements = table.querySelectorAll('thead th');
      headerElements.forEach(header => {
        headers.push(header.textContent.trim().replace(/\s/g, '_').toLowerCase());
      });

      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = {};
        cells.forEach((cell, index) => {
          rowData[headers[index]] = cell.textContent.trim();
        });
        data.push(rowData);
      });

      return data;
    }
    try {
      const request = fetch("https://app.tradingworks.net/Attendances/ClockInOut.aspx");
      const rawHtml = await request.then(res => res.text());

      const parser = new DOMParser();
      const document = parser.parseFromString(rawHtml, 'text/html');

      extraSettings['employ'] = document.getElementById('Body_lnkCompanyAlias').innerText;
      extraSettings['userName'] = document.getElementById('Body_Body_lblFullName').innerText;
      extraSettings['userImage'] = document.getElementById('Body_Body_imgAvatar').src;
      extraSettings['currentMonthAppointments'] = await getCurrentMonthAppointments();
    } catch (e) {
      // console.log(e);
      return extraSettings;
    }

    return extraSettings;
  }

  async #updateTradingWorksData() {
    console.log('[TradingWorks+] - Offscreen Update Data 🔄');
    const active = JSON.parse(localStorage.getItem('tradingWorksPlusStatusExtension'));
    if (!active){
      this.#setScreen('disabled');
      return setTimeout(async () => await this.#updateTradingWorksData(), 60000);
    }

    const userPoints = await this.#fetchUserPoints();
    const userTimeBank = await this.#fetchTimeBank();

    if(!userPoints){
      localStorage.setItem('tradingWorksPlusCalculatedData', JSON.stringify({}));
      return setTimeout(async () => await this.#updateTradingWorksData(), 1000);
    }

    const extraSettings = await this.#fetchExtraSettings();
    const currentSettings = JSON.parse(localStorage.getItem('tradingWorksSettings')) || {};
    const settings = {...currentSettings, ...extraSettings, lastUpdate: new Date()};

    localStorage.setItem('tradingWorksSettings', JSON.stringify(settings));

    const timeBank = userTimeBank/60;
    const points = userPoints;

    const data = OffscreenHelper.calculateInformation({ points, timeBank });
    TWOffscreenNotifications.handleSentMessages(data);

    localStorage.setItem('tradingWorksPlusCalculatedData', JSON.stringify(data));

    setTimeout(async () => await this.#updateTradingWorksData(), 30000);
  }

  #setScreen(screen) {
    chrome.runtime.sendMessage({
      type: 'changeScreen',
      data: { screen: screen }
    });
  }
}

new TWOffscreen();