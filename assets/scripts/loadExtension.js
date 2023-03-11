function updateWorkedHours(){
  const workedHours = document.querySelectorAll('table tbody tr');

  if(workedHours.length === 0) return console.log('Não estou no site do TradingWorks. 🤔');
  
  let workedTimes = timeCrawler(workedHours);
      workedTimes = calculatesBreaks(workedTimes);
  
  const totalWorkedTime = workedTimes.map(time => time.worked.workedMinutes).reduce((total, currentTime) => total + currentTime, 0);
  const totalBreakTime = workedTimes.map(time => time.break).reduce((total, currentTime) => total + currentTime, 0);

  const workInformations = {
    workedHours,
    workedTimes,
    totalWorkedTime,
    totalBreakTime
  }

  requestUpdatePopup(workInformations);
  handleSentMessages(workInformations);

  setTimeout(updateWorkedHours, 1000);
}

function timeCrawler(workedHours){
  [...workedHours].map((workedHour, index) => {
    const start = workedHour.querySelector('td:nth-child(2)').innerText;
    const end = workedHour.querySelector('td:nth-child(3)').innerText;
    
    return {worked: { startInText: start, endInText: end, workedMinutes: passTimeInStringToMinutes(end) - passTimeInStringToMinutes(start) }, break: 0}
  });
}


function calculatesBreaks(workedTimes){
  workedTimes.map((currentTime, index) => {
    let lastTime = workedTimes[index - 1];
    if(lastTime) currentTime.break = passTimeInStringToMinutes(currentTime.worked.startInText) - passTimeInStringToMinutes(lastTime.worked.endInText);
    
    return currentTime;
  });
}

function passTimeInStringToMinutes(time){
  let [hour, minute] = time.split(':').map(v => parseInt(v));
  
  if(isNaN(hour)) hour = (new Date).getHours();
  if(isNaN(minute)) minute = (new Date).getMinutes();
  
  if(!minute) minute = 0;
  
  return minute + (hour * 60);
}

async function requestUpdatePopup(infoToUpdate){
  const tableRows = [...infoToUpdate.workedHours].map(data => (
    [ data.querySelector('td:nth-child(2)').innerText, data.querySelector('td:nth-child(3)').innerText, data.querySelector('td:nth-child(4)').innerText ]
  ));

  let response;
  try{
    response = await chrome.runtime.sendMessage({
      msg: "popup_update",  data: {...infoToUpdate, tableRows}
    });
  }catch(e){
    return (response = undefined);
  }

  window.localStorage.setItem('tradingworks-plus-data', response.config)
}

function sendMsg(config, msg, msgId){
  let sentData = JSON.parse(localStorage.getItem('tradingworks-plus-sent-msg-dates'));
  const callMeBotURL = `https://api.callmebot.com/whatsapp.php?phone=${config['whatsapp-number']}&text=${msg.replace(/ /g, '+')}&apikey=${config['api-key']}`;

  if(!sentData) {localStorage.setItem('tradingworks-plus-sent-msg-dates', JSON.stringify({})); sentData = {}}
  if(sentData[msgId] === new Date().toLocaleDateString()) return;

  console.log('.:: Enviando mensagem! 📲');
  try{
    fetch(callMeBotURL);
  }catch(e){
    console.log('Erro ao enviar mensagem! 😢', e);
  }

  sentData[String(msgId)] = new Date().toLocaleDateString();
  localStorage.setItem('tradingworks-plus-sent-msg-dates', JSON.stringify(sentData));
}

function handleSentMessages(data){
  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));
  if(!config || config['allow-send-messages'] !== 'on') return;

  const minutesToFinish = passTimeInStringToMinutes(config['work-time']) - data.totalWorkedTime;
  
  if(minutesToFinish >= 0 && minutesToFinish <= 15) sendMsg(config, "Opa! Fica ligeiro. Faltam apenas 15 minutes para o fim do expediente.", 159);
  if(minutesToFinish <= 0 && minutesToFinish >= 1) sendMsg(config, "Fim do dia! Não esquece de bater o ponto.", 1);
  if(passTimeInStringToMinutes(config['break-time']) >= data.totalBreakTime) sendMsg(config, "Intervalo finalizado, hour de voltar! 🚀", 2);
}

(() => {
  updateWorkedHours();
  setInterval(() => location.reload(), 60000);
})();