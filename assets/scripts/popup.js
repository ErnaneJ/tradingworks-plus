class Popup {
  constructor(){
    this.information = undefined;
    this.settings = undefined;
  }

  updateContent(){
    this.#setScreen('loading');
    const active = JSON.parse(localStorage.getItem('tradingWorksPlusStatusExtension'));
    
    if(!active) return this.#setScreen('disabled');
    if(active) this.#setScreen('started');

    this.settings = JSON.parse(localStorage.getItem('tradingWorksSettings'));
    if(!this.settings) return this.#setScreen('not-started');

    this.information = JSON.parse(localStorage.getItem('tradingWorksPlusCalculatedData'));
    if(!this.information) return this.#setScreen('not-started');
    if(!this.information?.points) return this.#setScreen('not-logged');

    this.#setScreen('started');

    this.#updateTableTimes();
    this.#updateTableTotals();
    this.#updatePopupMsg();
    this.#updateCurrentBreakTime();

    this.#showDate();
  }

  #updateTableTimes() {
    if (!this.information) return;
    if(!this.information.points) return;
  
    const tableBodyTimes = document.getElementById('table-body-times');
    tableBodyTimes.innerHTML = this.information.points.map((point, index) => {
      const start = PopupHelper.formatDate(point.startDate, "hh:min")
      const end = PopupHelper.formatDate(point.endDate, "hh:min")
      const duration = PopupHelper.formatBalance(point.duration);
      const interval = point.interval ? PopupHelper.formatBalance(point.interval) : undefined;
  
      return (`<div class="table--row">
        <div class="table--item ${point.manualStartDate && 'manual'}">${start}</div>
        <div class="table--item ${point.manualEndDate && 'manual'}">${end}</div>
        <div class="table--item">${duration}</div>
      </div>` + (interval ? `
      <div class="table--row">
        <div class="table--item break">
          Pausa de ${interval}
        </div>
      </div>` : ''));
    }).join('');
  }

  #updateCurrentBreakTime(){
    if(!this.information.exceededCurrentBreakTime) return;
    
    const tableBodyTimes = document.getElementById('table-body-times');

    tableBodyTimes.innerHTML += `
      <div class="table--row">
        <div class="table--item break" ${this.information.exceededCurrentBreakTime && 'style="color: red;'}">
          Em pausa por ${ PopupHelper.formatBalance(this.information.currentBreakTime) }
        </div>
      </div>
    `;
  }

  #updateTableTotals() {
    const totalWorkedHours = document.getElementById('total-worked-hours');
    const totalBreakHours = document.getElementById('total-break-hours');
    const totalHoursBalance = document.getElementById('hours-balance');
  
    totalWorkedHours.innerHTML = PopupHelper.formatBalance(this.information.totalWorkedTime);
    totalBreakHours.innerHTML = PopupHelper.formatBalance(this.information.totalBreakTime);
    totalHoursBalance.innerHTML = PopupHelper.formatBalance(this.information.timeBank);
  }
  
  #updatePopupMsg() {
    const config = JSON.parse(window.localStorage.getItem('tradingWorksSettings'));
    
    PopupHelper.checkConfig(config);
  
    const estimatedOutputHour = document.getElementById('estimated-output-hour');
    const msg = document.getElementById('msg');
  
    const informedWorkTime = PopupHelper.passTimeInStringToHours(config['work-time']);
    const timeToFinish = (informedWorkTime - this.information.totalWorkedTime);

    if(timeToFinish === informedWorkTime){
      msg.innerHTML = 'Eai, vamos trabalhar hoje ou não? 🤔';
      estimatedOutputHour.innerHTML = '';
    }else if (timeToFinish > 0 && this.information.isWorking) {
      msg.innerHTML = `Faltam <strong>${PopupHelper.formatBalance(timeToFinish)}</strong> para o fim do seu expediente de ${PopupHelper.formatBalance(informedWorkTime)}. 🎉`;
      
      const currentDate = new Date();
      const estimatedOutputDate = currentDate.setHours(currentDate.getHours() + Math.floor(timeToFinish), currentDate.getMinutes() + (timeToFinish % 1) * 60);
      
      estimatedOutputHour.innerHTML = `Estimativa de saída às ${PopupHelper.formatDate(estimatedOutputDate, "hh:min")}`;
    } else if (this.information.isWorking){
      msg.innerHTML = `Se preparando para as férias? 🏖️ Você ja fez ${PopupHelper.formatBalance(timeToFinish * (-1))} extras.`;
      estimatedOutputHour.innerHTML = '';
    }else{
      msg.innerHTML = "Que ótimo dia de trabalho! "
      
      if(timeToFinish <= 0) msg.innerHTML += `Você fez ${PopupHelper.formatBalance(timeToFinish * (-1))} extras hoje.`;
      if(timeToFinish > 0) msg.innerHTML += `Você fez ${PopupHelper.formatBalance(timeToFinish)} a menos hoje.`;
      
      msg.innerHTML += " Até mais! 👋";
      estimatedOutputHour.innerHTML = '';
    }
  }
  
  #showDate() {
    const currentYear = document.getElementById('current-year');
    currentYear.innerHTML = new Date().getFullYear();
    
    const date = new Date();
    const dateElement = document.getElementById('current-date');
    dateElement.innerHTML = PopupHelper.formatDate(date, 'dd de MM, hh:min:ss');
  }

  #setScreen(screen){
    try {
      window.tradingWorks.setScreen(screen);
    }catch(e){
      console.log('Error setting screen', e);
    }
  }
}