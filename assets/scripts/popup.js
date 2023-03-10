function updateContent(document, data){
  const update = () => {
    checkConfig(document);
    handleSentMessages(data);
    updateTableTimes(document, data.tableRows, data.workedTimes);
    updateTableTotals(document, data.totalWorkedTime, data.totalBreakTime);
    updateMsg(document, data.totalWorkedTime);
    showDate(document);
  }; update();
  
  handleButtonConfig(document);
  setInterval(update, 1000);
}

function updateTableTimes(document, tableRows, workedTimes){
  const tableBodyTimes = document.getElementById('table-body-times');

  tableBodyTimes.innerHTML = tableRows.map((row, index) => {
    return (`<div class="table--row">
      <div class="table--item">${row[0]}</div>
      <div class="table--item">${row[1]}</div>
      <div class="table--item">${String(Math.floor(workedTimes[index].worked.workedMinutes/60)).padStart(2, '0')}:${String(workedTimes[index].worked.workedMinutes%60).padStart(2, '0')} h</div>
    </div>` + ((row[2] != "" && (index !== (tableRows.length - 1))) ? `
    <div class="table--row">
      <div class="table--item break">
        Pausa de ${String(Math.floor(workedTimes[index + 1]?.break/60)).padStart(2, '0')}:${String(workedTimes[index + 1]?.break%60).padStart(2, '0')} h
      </div>
    </div>
    ` : ''));
  }).join('');
}

function formatNumber(number){
  return String(Math.floor(number)).padStart(2, '0');
}

function  updateTableTotals(document, totalWorkedTime, totalBreakTime){
  const totalWorkedHours = document.getElementById('total-worked-hours');
  const totalBreakHours = document.getElementById('total-break-hours');

  totalWorkedHours.innerHTML = `${formatNumber(totalWorkedTime/60)}:${formatNumber(totalWorkedTime%60)} h`;
  totalBreakHours.innerHTML = `${formatNumber(totalBreakTime/60)}:${formatNumber(totalBreakTime%60)} h`;
}

function updateMsg(document, totalWorkedTime){
  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));
  const minutesToFinish = parse(config['work-time']) - totalWorkedTime;
  const msg = document.getElementById('msg');

  if(minutesToFinish >= 0){
    msg.innerHTML = `Faltam apenas <strong>${formatNumber(minutesToFinish/60)} horas</strong> e <strong>${minutesToFinish%60} minutos</strong> para o fim do expediente de ${config['work-time']} horas. 🎉`;
  }else{
    msg.innerHTML = `Se preparando para as férias? 🏖️ Você ja fez <strong>${formatNumber((minutesToFinish * (-1))/60)} horas<strong> e <strong>${formatNumber((minutesToFinish* (-1))%60)}</strong> minutos extra.`;
  } 
}

function showDate(document){
  const date = new Date();
  const dateElement = document.getElementById('current-date');
  dateElement.innerHTML = formatDate(date, 'dd de MM, hh:min:ss');
  console.log(formatDate(date, 'dd de MM, hh:min:ss'));
}

function formatDate(date, format) {
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

function handleButtonConfig(document){
  const buttonConfig = document.getElementById('button-config');
  buttonConfig.addEventListener('click', openConfig);
}

function openConfig(){
  chrome.tabs.create({'url': chrome.runtime.getURL('./config/index.html')}, (tab) => { });
}

function checkConfig(){
  window.localStorage.getItem('tradingworks-plus-data') ? '' : openConfig();
}

function sendMsg(phone, apiKey, msg, msgId){
  let msgDates = {}
  const callMeBotURL = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${msg.replace(/ /g, '+')}&apikey=${apiKey}`;
  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));

  msgDates[msgId] = { date: new Date().toLocaleDateString() }

  if(
    config['sent-msg-dates'] && 
    config['sent-msg-dates'][msgId] && 
    config['sent-msg-dates'][msgId].date === new Date().toLocaleDateString()
  ) return;

  console.log('.:: Enviando mensagem! 📲')
  fetch(callMeBotURL);

  window.localStorage.setItem('tradingworks-plus-data', JSON.stringify({
    ...config,
    'sent-msg-dates': { ...msgDates }
  }));
}


function handleSentMessages(data){
  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));
  if(config['allow-send-messages'] !== 'on') return;

  const minutesToFinish = parse(config['work-time']) - data.totalWorkedTime;
  
  if(minutesToFinish >= 0 && minutesToFinish <= 15) sendMsg(config['whatsapp-number'], config['api-key'], "Opa! Fica ligeiro. Faltam apenas 15 minutos para o fim do expediente.", 0);
  if(minutesToFinish <= 0 && minutesToFinish >= 1) sendMsg(config['whatsapp-number'], config['api-key'], "Fim do dia! Não esquece de bater o ponto.", 1);
  if(parse(config['break-time']) === data.totalBreakTime) sendMsg(config['whatsapp-number'], config['api-key'], "Intervalo finalizado, hora de voltar! 🚀", 2);
}