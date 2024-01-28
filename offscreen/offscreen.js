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

    const userPoints = await this.#fetchUserPoints(user.employeeid, user.companyid);
    const userTimeBank = await this.#fetchTimeBank(user.employeeid, user.companyid);

    if (!userPoints || !userTimeBank){
      this.#setScreen('not-started');
      return null;
    };

    this.#setScreen('started');

    const timeBank = userTimeBank.listResponse.map(el => el.compTime).reduce((acc, cur) => acc + cur, 0);
    const points = userPoints.listResponse;

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