class TWOffscreen {
  TRADING_WORKS_POINTS_API = 'https://api-main.tworh.com.br/api/attendanceregister/list';
  TRADING_WORKS_TIME_BANK_API = 'https://api-main.tworh.com.br/api/CompTimeEvent/list';

  constructor() {
    this.isWorking = false;
    this.points = [];
    this.totalInterval = 0.0;
    this.totalTimeWorked = 0.0;
    this.timeBank = 0.0;

    this.companyId = "5135";
    this.employeeId = "87497";

    this.initialize();
  }

  async initialize() {
    this.#keepAlive();
    this.#updateTradingWorksData();
  }

  get configurations() {
    try {
      return JSON.parse(localStorage.getItem('tradingworks-plus-data'));
    } catch (e) {
      return null;
    }
  }

  async #fetchUserPoints() {
    try {
      // ?CompanyId=<0000>&EmployeeId=<00000>&BaseDate=<YYYY-MM-DDT20%3A08%3A39.4527475>
      const URL = `${this.TRADING_WORKS_POINTS_API}?CompanyId=${this.companyId}&EmployeeId=${this.employeeId}&BaseDate=${new Date().toISOString()}`;
      const rawData = await fetch(URL, {method: 'GET', headers: {'User-Agent': 'insomnia/8.5.1'}});

      return await rawData.json();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async #fetchTimeBank() {
    // ?EmployeeId=<00000>&CompanyId=<0000>&ViewHistory=false
    try {
      const URL = `${this.TRADING_WORKS_TIME_BANK_API}?EmployeeId=${this.employeeId}&CompanyId=${this.companyId}&ViewHistory=false`;
      const rawData = await fetch(URL, {method: 'GET', headers: {'User-Agent': 'insomnia/8.5.1'}});

      return await rawData.json();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async #updateTradingWorksData() {
    this.#setScreen('loading');

    const config = this.configurations;
    console.log(config)
    if (!config) return setTimeout(async () => await this.#updateTradingWorksData(), 120000);

    const userPoints = await this.#fetchUserPoints();
    const userTimeBank = await this.#fetchTimeBank();

    this.timeBank = userTimeBank.listResponse.map(el => el.compTime).reduce((acc, cur) => acc + cur, 0);
    this.points = userPoints.listResponse;

    chrome.runtime.sendMessage({
      type: 'updateWorkInformation',
      data: {
        points: this.points,
        timeBank: this.timeBank
      }
    });

    this.#setScreen('home');

    setTimeout(async () => await this.#updateTradingWorksData(), 60000);
  }

  #keepAlive() {
    setInterval(() => chrome.runtime.sendMessage({ type: 'keepAlive', data: {} }), 1000);
  }

  #setScreen(screen) {
    chrome.runtime.sendMessage({
      type: 'changeScreen',
      data: {
        screen: screen
      }
    });
  }
}

new TWOffscreen();