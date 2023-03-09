// function sentWhatsappMessage(){
//   const callMeBotURL = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=Bater+o+ponto&apikey=${apikey}`;
// }

function updateWorkedHours(){
  const workedHours = document.querySelectorAll('table tbody tr');
  
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
  const minutesToFinish = 360 - totalWorkedTime;

  requestUpdatePopup({
    workedHours,
    workedTimes,
    totalWorkedTime,
    totalBreakTime,
    minutesToFinish,
  });
}

function parse(horario){
  let [hora, minuto] = horario.split(':').map(v => parseInt(v));
  
  if(isNaN(hora)) hora = (new Date).getHours();
  if(isNaN(minuto)) minuto = (new Date).getMinutes();
  
  if(!minuto) minuto = 0;
  
  return minuto + (hora * 60);
}

function requestUpdatePopup(infoToUpdate){
  const tableRows = [...infoToUpdate.workedHours].map(data => {
    return [
      data.querySelector('td:nth-child(2)').innerText,
      data.querySelector('td:nth-child(3)').innerText,
      data.querySelector('td:nth-child(4)').innerText
    ]
  });

  chrome.runtime.sendMessage({
    msg: "popup_update", 
    data: {...infoToUpdate, tableRows}
  });
}
  
updateWorkedHours();