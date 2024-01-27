class Popup {
  constructor(){
    this.information = undefined;
  }

  updateContent(data){
    this.information = PopupHelper.calculateInformation(data);

    if(this.information.points.length === 0) return this.#setScreen('not-started');

    this.#updateTableTimes();
    this.#updateTableTotals();
    this.#updatePopupMsg();
    this.#updateCurrentBreakTime();

    this.#showDate();
  }

  #updateTableTimes() {
    if (!this.information) return;
  
    const tableBodyTimes = document.getElementById('table-body-times');
    tableBodyTimes.innerHTML = this.information.points.map((point, index) => {
      const start = PopupHelper.formatDate(point.startDate, "hh:min")
      const end = PopupHelper.formatDate(point.endDate, "hh:min")
      const duration = PopupHelper.formatBalance(point.duration);
      const interval = point.interval ? PopupHelper.formatBalance(point.interval) : undefined;
  
      return (`<div class="table--row">
        <div class="table--item">${start}</div>
        <div class="table--item">${end}</div>
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
    if(!this.information.isWorking || this.information.totalWorkedTime >= PopupHelper.passTimeInStringToHours(config['work-time'])) return;
    
    const tableBodyTimes = document.getElementById('table-body-times');
    const config = JSON.parse(window.localStorage.getItem('tradingWorksSettings'));

    const lastWorkedTimeEnd = this.information.points.slice(-1)[0].endDate;
    const currentBreakTime = PopupHelper.calculateDiffDates(new Date(lastWorkedTimeEnd), new Date());
    const breakInformedTime = PopupHelper.passTimeInStringToHours(config['break-time']);
    const exceededBreakTime = currentBreakTime >= breakInformedTime;

    tableBodyTimes.innerHTML += `
      <div class="table--row">
        <div class="table--item break" ${exceededBreakTime && 'style="color: red;'}">
          Em pausa por ${ PopupHelper.formatBalance(currentBreakTime) }
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
  
    if (timeToFinish > 0 && this.information.isWorking) {
      msg.innerHTML = `Faltam <strong>${PopupHelper.formatBalance(timeToFinish)}</strong> para o fim do seu expediente de ${PopupHelper.formatBalance(informedWorkTime)}. 🎉`;
      estimatedOutputHour.innerHTML = `Estimativa de saída às ${PopupHelper.formatBalance(timeToFinish)}`;
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
    
    setInterval(() => {
      const date = new Date();
      const dateElement = document.getElementById('current-date');
      dateElement.innerHTML = PopupHelper.formatDate(date, 'dd de MM, hh:min:ss');
    });
  }

  #setScreen(screen){
    window.tradingWorks.setScreen(screen);
  }
}