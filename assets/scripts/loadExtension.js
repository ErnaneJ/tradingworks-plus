function updateWorkedHours(){
  const workedHours = document.querySelectorAll('table tbody tr');

  if(workedHours.length === 0) return console.log('Não estou no site do TradingWorks');
  
  let workedTimes = [...workedHours].map((workedHour, index) => {
    const start = workedHour.querySelector('td:nth-child(2)').innerText;
    const end = workedHour.querySelector('td:nth-child(3)').innerText;
    
    return {worked: { startInText: start, endInText: end, workedMinutes: parse(end) - parse(start) }, break: 0}
  });
  
  workedTimes = workedTimes.map((currentTime, index) => {
    let lastTime = workedTimes[index - 1];
    if(lastTime) currentTime.break = parse(currentTime.worked.startInText) - parse(lastTime.worked.endInText);
    
    return currentTime;
  });
  
  const totalWorkedTime = workedTimes.map(time => time.worked.workedMinutes).reduce((total, currentTime) => total + currentTime, 0);
  const totalBreakTime = workedTimes.map(time => time.break).reduce((total, currentTime) => total + currentTime, 0);

  const data = {
    workedHours,
    workedTimes,
    totalWorkedTime,
    totalBreakTime
  }

  requestUpdatePopup(data);
  handleSentMessages(data);

  setTimeout(updateWorkedHours, 1000); 
}

function parse(horario){
  let [hora, minuto] = horario.split(':').map(v => parseInt(v));
  
  if(isNaN(hora)) hora = (new Date).getHours();
  if(isNaN(minuto)) minuto = (new Date).getMinutes();
  
  if(!minuto) minuto = 0;
  
  return minuto + (hora * 60);
}

async function requestUpdatePopup(infoToUpdate){
  const tableRows = [...infoToUpdate.workedHours].map(data => {
    return [
      data.querySelector('td:nth-child(2)').innerText,
      data.querySelector('td:nth-child(3)').innerText,
      data.querySelector('td:nth-child(4)').innerText
    ]
  });

  let response;
  try{
    response = await chrome.runtime.sendMessage({
      msg: "popup_update", 
      data: {...infoToUpdate, tableRows}
    });
  }catch(e){
    response = undefined;
    return;
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

  const minutesToFinish = parse(config['work-time']) - data.totalWorkedTime;
  
  if(minutesToFinish >= 0 && minutesToFinish <= 15) sendMsg(config, "Opa! Fica ligeiro. Faltam apenas 15 minutos para o fim do expediente.", 159);
  if(minutesToFinish <= 0 && minutesToFinish >= 1) sendMsg(config, "Fim do dia! Não esquece de bater o ponto.", 1);
  if(true || parse(config['break-time']) === data.totalBreakTime) sendMsg(config, "Intervalo finalizado, hora de voltar! 🚀", 2);
}

updateWorkedHours();