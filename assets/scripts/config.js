class DashboardHelper {
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
  static submitSettings(){
    const form = document.querySelector('#settings-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      try{
        const formData = new FormData(event.target);
        const formattedFormData = Object.fromEntries(formData.entries());

        const currentSettings = JSON.parse(localStorage.getItem('tradingWorksSettings')) || {};
        const settings = {...currentSettings, ...formattedFormData};
        localStorage.setItem('tradingWorksSettings', JSON.stringify(settings));
        chrome.runtime.sendMessage({type: 'updateSettings', data: settings});

        const button = document.querySelector('button[type="submit"]');
        button.innerHTML = 'Sucesso! 🎉';
        form.classList.remove('invalid');

        DashboardHelper.notify({
          browser: 'Configurações salvas com sucesso. 🚀',
          whats: '🤖 *TW+:* Configurações salvas com sucesso. 🚀'
        });
    
        setTimeout(() => {
          button.innerHTML = '💾 Salvar';
          window.location.reload();
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

  static handleTimeInputs(){
    let hoursInputs = document.querySelectorAll("#work-time, #break-time")
  
    const format = event => {
      let value = event.target.value
    
      value = value.replace(/[a-zA-Z\:]/g, '');
      value = value.padStart(4, '0');
  
      if (event.key === 'Backspace') {
        event.preventDefault();
        value = value.substring(0, value.length);
        value = value.padStart(4, '0');
      } else if("1234567890".includes(event.key)){
        value = value.substring(1);
        value = value.padEnd(4, '0');
      } else{
        event.preventDefault();
      }
  
      event.target.value = value.replace(/(\d{2})(\d{2})/, '$1:$2');
  
      const hours = parseInt(event.target.value.split(':')[0]);
      const minutes = parseInt(event.target.value.split(':')[1]);
  
      if(hours > 23 || minutes > 59) {
        document.querySelector('form').classList.add('invalid');
        event.target.style.outline = '2px solid #db4444';
      }else{
        document.querySelector('form').classList.remove('invalid');
        event.target.style.outline = 'initial';
      }
    }
  
    hoursInputs.forEach((input) => {
      input.addEventListener('keyup', format);
    });
  }  
}
class DashboardLoader {
  static loadTWInfo(){
    const companyNameInput = document.getElementById("tw-info-companyname");
    const shortName = document.getElementById("tw-info-shortName");
    const userNameInput = document.getElementById("tw-info-username");
    const userAvatar = document.getElementById("tw-info-avatar");
    const lastUpdate = document.getElementById("last-update");

    const settings = JSON.parse(localStorage.getItem('tradingWorksSettings'));
    if(!settings) return;

    if(settings.userName){
      shortName.innerText = settings.userName.split(' ')[0];
      userNameInput.value = settings.userName;
    }

    if(settings.employ) companyNameInput.value = settings.employ;

    if(settings.userImage) userAvatar.src = settings.userImage;

    if(settings.lastUpdate) {
      lastUpdate.innerText = `Última sincronização em ${new Date(settings.lastUpdate).toLocaleString('pt-BR')}`;
    }else{
      lastUpdate.innerText = 'Não sincronizado. Verifique sua sessão no TradingWorks.';
    }
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
class DashboardLoadData {
  constructor(){
    this.settings = JSON.parse(localStorage.getItem('tradingWorksSettings')) || {};
    this.currentGraphShowing = 0;

    this.loadTable();
    this.loadCharts();
  }

  loadTable(){
    if(!this.settings) return;
    if(!this.settings.currentMonthAppointments) return;
    
    const tableContainer = document.getElementById('table-appointments');
    tableContainer.classList.remove('hidden');

    const currentMonthAppointments = this.settings.currentMonthAppointments;
    if(!currentMonthAppointments) return;

    const table = document.querySelector('#table-appointments');
    const tbody = table.querySelector('tbody');

    currentMonthAppointments.reverse().forEach(appointment => {
      const tr = document.createElement('tr');
      
      const jornada = appointment.jornada != '' ? appointment.jornada.split('  ').map(h => `<span>${h.trim()}</span>`).join('\n') : '-';

      tr.innerHTML  = `<td>${appointment.data || '-'}</td>`;            // Data
      tr.innerHTML += `<td>${jornada}</td>`;                            // Pontos
      tr.innerHTML += `<td>${appointment.horas_em_pausas || '-'}</td>`; // Em Pausa
      tr.innerHTML += `<td>${appointment["horas_trab."] || '-'}</td>`;  // Trabalhando
      tr.innerHTML += `<td>${appointment.horas_totais || '-'}</td>`;    // Total

      tbody.appendChild(tr);
    });

    const currentMonth = document.querySelectorAll('span[data-content="current-month"]');
    currentMonth.forEach(span => span.innerText = '- ' + new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
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

  async loadCharts(){
    if(!this.settings) return;
    if(!this.settings.currentMonthAppointments) return;

    const chartContainers = document.getElementById('charts-container');
    chartContainers.classList.remove('hidden');

    this.#chartNumberOfPointsPerDay();
    this.#chartHoursOfBreakPerDay();
    this.#chartHoursWorkedPerDay();
    this.#chartTotalHoursWorked();

    this.loadChartsIteration();
  }

  #showChart(){
    const numberOfPointsPerDay = document.querySelector("[data-chart='number-of-points-per-day']");
    const hoursOfBreakPerDay = document.querySelector("[data-chart='hours-of-break-per-day']");
    const hoursWorkedPerDay = document.querySelector("[data-chart='hours-worked-per-day']");
    const totalHoursWorked = document.querySelector("[data-chart='total-hours-worked']");

    const charts = [numberOfPointsPerDay, hoursOfBreakPerDay, hoursWorkedPerDay, totalHoursWorked];

    charts.forEach(chart => chart.classList.add('hidden'));

    charts[this.currentGraphShowing % charts.length].classList.remove('hidden');
  }

  #chartNumberOfPointsPerDay(){
    const containerHeight = document.querySelector('.chart-container').offsetHeight;
    const chart = document.getElementById('number-of-points-per-day');
    if(!chart) return;

    const labels = this.settings.currentMonthAppointments.map(item => item.data)
    const data = this.settings.currentMonthAppointments.map(item => item.jornada.split('  ').filter(Boolean).length)

    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Pontos registrados por Dia',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return `${value} ponto${value != 1 ? 's' : ''}`;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;

                return `${value} ponto${value != 1 ? 's' : ''} ${value % 2 === 0 ? '✅' : '❌'}`;
              }
            }
          }
        }
      }
    });

    chart.style.height = `${containerHeight - 150}px`
    chart.style.width = '100%';
  }

  #chartHoursOfBreakPerDay(){
    const containerHeight = document.querySelector('.chart-container').offsetHeight;
    const chart = document.getElementById('hours-of-break-per-day');
    if(!chart) return;

    const labels = this.settings.currentMonthAppointments.map(item => item.data)
    const data = this.settings.currentMonthAppointments.map(item => {
      const [hours, minutes] = item.horas_em_pausas.split(':');
      return parseFloat(hours) * 60 + parseFloat(minutes);
    });

    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tempo de intervalo por Dia',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                const hours = Math.floor(value / 60);
                const minutes = value % 60;

                let text = '';
                if(hours > 0) text += `${hours}h `;
                if(minutes > 0) text += `${minutes}min`;

                return text;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                
                let text = '';
                if(hours > 0) text += `${hours}h `;
                if(minutes > 0) text += `${minutes}min`;

                return text;
              }
            }
          }
        }
      }
    });

    chart.style.height = `${containerHeight - 150}px`
    chart.style.width = '100%';
  }

  #chartHoursWorkedPerDay(){
    const containerHeight = document.querySelector('.chart-container').offsetHeight;
    const chart = document.getElementById('hours-worked-per-day');
    if(!chart) return;

    const labels = this.settings.currentMonthAppointments.map(item => item.data)
    const data = this.settings.currentMonthAppointments.map(item => {
      const [hours, minutes] = item['horas_trab.'].split(':');
      return parseFloat(hours) * 60 + parseFloat(minutes);
    });

    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Horas trabalhadas por Dia',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                const hours = Math.floor(value / 60);
                const minutes = value % 60;

                let text = '';
                if(hours > 0) text += `${hours}h `;
                if(minutes > 0) text += `${minutes}min`;

                return text;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                
                let text = '';
                if(hours > 0) text += `${hours}h `;
                if(minutes > 0) text += `${minutes}min`;

                return text;
              }
            }
          }
        }
      }
    });

    chart.style.height = `${containerHeight - 150}px`
    chart.style.width = '100%';
  }

  #chartTotalHoursWorked(){
    const containerHeight = document.querySelector('.chart-container').offsetHeight;
    const chart = document.getElementById('total-hours-worked');
    if(!chart) return;

    const labels = this.settings.currentMonthAppointments.map(item => item.data)
    const data = this.settings.currentMonthAppointments.map(item => {
      const [hours, minutes] = item.horas_totais.split(':');
      return parseFloat(hours) * 60 + parseFloat(minutes);
    });

    new Chart(chart, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tempo de Jornada por Dia',
          data: data,
          borderWidth: 1,
          backgroundColor: '#A7BF31' 
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                const hours = Math.floor(value / 60);
                const minutes = value % 60;

                let text = '';
                if(hours > 0) text += `${hours}h `;
                if(minutes > 0) text += `${minutes}min`;

                return text;
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                
                let text = '';
                if(hours > 0) text += `${hours}h `;
                if(minutes > 0) text += `${minutes}min`;

                return text;
              }
            }
          }
        }
      }
    });

    chart.style.height = `${containerHeight - 150}px`
    chart.style.width = '100%';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  DashboardLoader.loadTWInfo();
  new DashboardLoadData();

  DashboardHelper.allowSendMessageToggle();
  
  DashboardForms.submitSettings();
  DashboardForms.submitSendMessage();
  DashboardForms.handleTimeInputs();

  DashboardLoader.loadSettings();
});