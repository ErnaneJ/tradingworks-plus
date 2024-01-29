class DashboardHelper {
  static decideScreen(){
    const loginScreen = document.querySelector('#login-screen');
    const configScreen = document.querySelector('#dashboard-screen');
    
    const user = JSON.parse(localStorage.getItem('tradingWorksUser'));
  
    if(user){
      loginScreen.classList.add('hidden');
      configScreen.classList.remove('hidden');

      DashboardLoader.loadTWInfo();
      new DashboardCharts();
    }else{
      loginScreen.classList.remove('hidden');
      configScreen.classList.add('hidden');
    }
  }

  static parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
  }

  static allowSendMessageToggle(){
    const toggle = document.querySelector('#allow-send-messages-whatsapp');
    toggle.addEventListener('change', e => {
      const number = document.querySelector('#whatsapp-number');
  
      [number].forEach(input => {
        input.classList.toggle('disabled');
        input.disabled = !input.disabled;
      });
    });
  }

  static async notify(messages){
    const number = document.querySelector('#whatsapp-number').value;
    
    const allowSendMessageWhatsapp = document.querySelector('#allow-send-messages-whatsapp')?.checked;
    const allowSendMessageBrowser = document.querySelector('#allow-send-messages-browser')?.checked;
  
    if(!allowSendMessageBrowser && !allowSendMessageWhatsapp) alert('Você precisa habilitar ao menos uma opção de envio de mensagem. 🚨')
  
    if(allowSendMessageBrowser) await chrome.notifications.create(
      `trading-works-plus-msg-${new Date().getTime()}`, {
        type: "basic",
        iconUrl: "/assets/favicon48.png",
        title: "TradingWorks+",
        message: messages.browser,
      }, () => { }
    );
  
    if(allowSendMessageWhatsapp) {
      if(!number) return alert('Você precisa informar um número de WhatsApp para receber mensagens. 🚨');

      const optionsMessage = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: `{"number":"${number}","message":"${messages.whats}","token":"3967f4a6-3cd3-4ded-b08e-3fcbf3dbf6a9"}`
      };

      fetch('https://buddy.ernane.dev/api/v1/send-message/', optionsMessage)
        .then(response => response.json()).then(response => {})
        .catch(err => alert('Houve um erro ao enviar mensagem no WhatsApp, verifique as informações e tente novamente. 😢', err));
    }
  }
}
class DashboardForms {
  static submitLogin(){
    const loginForm = document.querySelector('#login-form');
    const inputLogin = document.querySelector('#login');
    const inputPassword = document.querySelector('#password');

    loginForm.addEventListener('submit', async event => {
      event.preventDefault();

      try{
        const request = await fetch("https://api-infra.tworh.com.br/api/auth/login", {
          "method": "POST",
          "headers": {
            "accept": "application/json",
            "content-type": "application/json;charset=UTF-8"
          },
          "referrerPolicy": "no-referrer",
          "body": `{\"username\":\"${inputLogin.value}\",\"password\":\"${inputPassword.value}\",\"rememberMe\":true}`
        });
    
        const response = await request.json();
        const token = response.listResponse[0].userToken;
        const user = DashboardHelper.parseJwt(token);

        localStorage.setItem('tradingWorksUser', JSON.stringify({...user, userToken: token}));

        DashboardHelper.decideScreen();
      }catch(err){
        console.log(err);

        Array.from(loginForm.querySelectorAll('.invalid-input')).forEach(alert => {
          alert.classList.remove('hidden');
          setTimeout(() => {
            alert.classList.add('hidden');
          }, 3000);
        });
      }
    });
  }

  static submitSettings(){
    const form = document.querySelector('#settings-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      try{
        const formData = new FormData(event.target);
        const formattedFormData = Object.fromEntries(formData.entries());

        localStorage.setItem('tradingWorksSettings', JSON.stringify(formattedFormData));
        chrome.runtime.sendMessage({type: 'updateSettings', data: formattedFormData});

        const button = document.querySelector('button[type="submit"]');
        button.innerHTML = 'Sucesso! 🎉';
        form.classList.remove('invalid');

        DashboardHelper.notify({
          browser: 'Configurações salvas com sucesso. 🚀',
          whats: '🤖 *TW+:* Configurações salvas com sucesso. 🚀'
        });
    
        setTimeout(() => {
          button.innerHTML = '💾 Salvar';
        }, 2000);
      }catch(e){
        console.log(e);
      }
    });
  }

  static submitSendMessage(){
    const button = document.querySelector('button#send-message');
    button.addEventListener('click', e => {
      e.preventDefault();
      
      DashboardHelper.notify({
        browser: 'Olá!👋 Teste de notificações do TradingWorks+ no navegador. Por aqui está tudo certo. 🤗',
        whats: '🤖 *TW+:* Olá!👋 Esse é um teste de notificação do Tradingworks+ no Whatsapp. Por aqui está tudo certo! 🚀'
      });
    });
  }
}
class DashboardLoader {
  static loadTWInfo(){
    const companyNameInput = document.getElementById("tw-info-companyname");
    const issInput = document.getElementById("tw-info-iss");
    const emailInput = document.getElementById("tw-info-email");
    const payRollRuleTitleInput = document.getElementById("tw-info-payrollruletitle");
    const companyIdInput = document.getElementById("tw-info-companyid");
    const employeeIdInput = document.getElementById("tw-info-employeeid");
    const userName = document.getElementById("tw-info-username");

    const user = JSON.parse(localStorage.getItem('tradingWorksUser'));
    if(!user) return;

    companyNameInput.value = user.companyname;
    issInput.value = user.iss;
    emailInput.value = user.email;
    payRollRuleTitleInput.value = user.payrollruletitle;
    companyIdInput.value = user.companyid;
    employeeIdInput.value = user.employeeid;
    userName.innerText = user.nickname;
  }

  static loadSettings(){
    const form = document.querySelector('#settings-form');
    const settings = JSON.parse(localStorage.getItem('tradingWorksSettings'));

    if(!settings) return form.classList.add('invalid');;

    form['work-time'].value = settings['work-time'] || '';
    form['break-time'].value = settings['break-time'] || '';
    form['whatsapp-number'].value = settings['whatsapp-number'] || '';
    form['allow-send-messages-whatsapp'].checked = settings['allow-send-messages-whatsapp'] === 'on';
    form['allow-send-messages-browser'].checked = settings['allow-send-messages-browser'] === 'on';

    if(settings['allow-send-messages-whatsapp'] !== 'on'){
      const number = document.querySelector('#whatsapp-number');

      [number].forEach(input => {
        input.classList.add('disabled');
        input.disabled = true;
      });
    }
  }
}
class DashboardCharts {
  constructor(){
    this.timeCardData = null;
    this.bankHoursData = null;
    this.currentGraphShowing = 0;

    this.loadCharts();
    this.loadChartsIteration();
  }

  loadChartsIteration(){
    const arrowLeft = document.querySelector('.chart-arrow-left');
    const arrowRight = document.querySelector('.chart-arrow-right');

    document.addEventListener('keydown', e => {
      if(e.key === 'ArrowLeft'){
        this.currentGraphShowing = this.currentGraphShowing <= 0 ? 0 : this.currentGraphShowing -1;
        this.#showChart();
      }

      if(e.key === 'ArrowRight'){
        this.currentGraphShowing++;
        this.#showChart();
      }
    });

    arrowLeft.addEventListener('click', () => {
      this.currentGraphShowing = this.currentGraphShowing <= 0 ? 0 : this.currentGraphShowing-1;
      this.#showChart();
    });

    arrowRight.addEventListener('click', () => {
      this.currentGraphShowing++;
      this.#showChart();
    });
  }

  async captureInformation(){
    const user = JSON.parse(localStorage.getItem('tradingWorksUser'));
    
    if(!user) return;
    
    const [rawBankTimeData, rawTimeCardData] = await Promise.all([fetch(`https://api-main.tworh.com.br/api/CompTimeEvent/list?EmployeeId=${user.employeeid}&CompanyId=${user.companyid}&ViewHistory=false`, {
      "method": "GET",
      "headers": {
        "accept": "application/json, text/plain, */*",
        "authorization": `Bearer ${user.token}`,
        "content-type": "application/json",
      }
    }), fetch(`https://api-main.tworh.com.br/api/Timecard/list?EmployeeId=${user.employeeid}&CompanyId=${user.companyid}`, {
      "method": "GET",
      "headers": {
        "accept": "application/json, text/plain, */*",
        "authorization": `Bearer ${user.token}`,
        "content-type": "application/json",
      }
    })]);

    const [bankTimeData, timeCardData] = await Promise.all([rawBankTimeData.json(), rawTimeCardData.json()]);

    this.timeCardData = timeCardData.listResponse;
    this.bankHoursData = bankTimeData.listResponse;
  }

  async loadCharts(){
    await this.captureInformation();

    this.#chartBankOfHoursPerRelease();
    this.#chartDaysAbsentPerMonth();
    this.#chartHoursWorkedPerMonth();
    this.#chartOvertimePerMonth();

    this.#removeLoading();
  }

  #removeLoading(){
    const loading = document.querySelector('#dash-loading-screen');
    loading.classList.add('hidden');
  }

  #showChart(){
    const chartBankOfHoursPerRelease = document.querySelector("[data-chart='chart-bank-of-hours-per-release']");
    const chartDaysAbsentPerMonth = document.querySelector("[data-chart='chart-days-absent-per-month']");
    const chartHoursWorkedPerMonth = document.querySelector("[data-chart='chart-hours-worked-per-month']");
    const chartOvertimePerMonth = document.querySelector("[data-chart='chart-overtime-per-month']");

    const charts = [chartBankOfHoursPerRelease, chartDaysAbsentPerMonth, chartHoursWorkedPerMonth, chartOvertimePerMonth];

    charts.forEach(chart => chart.classList.add('hidden'));

    charts[this.currentGraphShowing % charts.length].classList.remove('hidden');
  }

  #chartBankOfHoursPerRelease(){
    const chart = document.getElementById('chart-bank-of-hours-per-release');

    if(!chart) return;

    const bankHoursData = this.bankHoursData.sort((a, b) => {
      const dateA = new Date(a.baseDate);
      const dateB = new Date(b.baseDate);

      return dateA - dateB;
    });

    const groupedData = {};

    bankHoursData.forEach((entry, i) => {
      const createdDate = new Date(entry.baseDate);
      const monthYear = createdDate.toLocaleString('pt-BR', { month: 'numeric', year: 'numeric' });
  
      if (!groupedData[monthYear]) groupedData[monthYear] = 0;
  
      groupedData[monthYear] += entry.compTime;
    });

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Saldo do Banco de Horas por mês/lançamento',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  #chartDaysAbsentPerMonth(){
    const chart = document.getElementById('chart-days-absent-per-month');

    if(!chart) return;

    const timeCardData = this.timeCardData.sort((a, b) => {
      const dateA = new Date(a.toDate);
      const dateB = new Date(b.toDate);

      return dateA - dateB;
    });

    const groupedData = {};

    timeCardData.forEach((entry, i) => {
      const createdDate = new Date(entry.toDate);
      const monthYear = createdDate.toLocaleString('pt-BR', { month: 'numeric', year: 'numeric' });
  
      if (!groupedData[monthYear]) groupedData[monthYear] = 0;
  
      groupedData[monthYear] += entry.absentDays;
    });

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);
    
    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Dias Ausentes por Mês',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  #chartHoursWorkedPerMonth(){
    const chart = document.getElementById('chart-hours-worked-per-month');

    const timeCardData = this.timeCardData.sort((a, b) => {
      const dateA = new Date(a.toDate);
      const dateB = new Date(b.toDate);

      return dateA - dateB;
    });

    const groupedData = {};

    timeCardData.forEach((entry, i) => {
      const createdDate = new Date(entry.toDate);
      const monthYear = createdDate.toLocaleString('pt-BR', { month: 'numeric', year: 'numeric' });
  
      if (!groupedData[monthYear]) groupedData[monthYear] = 0;
  
      groupedData[monthYear] += entry.workedHours;
    });

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);
    
    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Horas trabalhadas por Mês',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  #chartOvertimePerMonth(){
    const chart = document.getElementById('chart-overtime-per-month');

    const timeCardData = this.timeCardData.sort((a, b) => {
      const dateA = new Date(a.toDate);
      const dateB = new Date(b.toDate);

      return dateA - dateB;
    });

    const groupedData = {};

    timeCardData.forEach((entry, i) => {
      const createdDate = new Date(entry.toDate);
      const monthYear = createdDate.toLocaleString('pt-BR', { month: 'numeric', year: 'numeric' });
  
      if (!groupedData[monthYear]) groupedData[monthYear] = 0;
  
      groupedData[monthYear] += entry.overtimeHours;
    });

    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);
    
    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Horas extras acumuladas por Mês',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  DashboardHelper.decideScreen();
  DashboardHelper.allowSendMessageToggle();
  
  DashboardForms.submitLogin();
  DashboardForms.submitSettings();
  DashboardForms.submitSendMessage();

  DashboardLoader.loadSettings();
});