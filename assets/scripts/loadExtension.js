// function sentWhatsappMessage(){
//   const callMeBotURL = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=Bater+o+ponto&apikey=${apikey}`;
// }

const updateWorkedHours = () => {
  const workedHours = document.querySelectorAll('table tbody tr');

  // appendContent(workedHours);

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

  console.log(`${Math.floor(totalWorkedTime/60)} horas e ${totalWorkedTime%60} minutos de trabalho`);
  console.log(`${Math.floor(totalBreakTime/60)} horas e ${totalBreakTime%60} minutos de pausas`);
  if(minutesToFinish >= 0){
    console.log(`Faltam apenas ${Math.floor(minutesToFinish/60)} horas e ${minutesToFinish%60} minutos o fim do expediente (6 horas).`);
  }else{
    console.log(minutesToFinish)
    console.log(`Opa! Se preparando para as férias? Você ultrapassou ${Math.floor((minutesToFinish * (-1))/60)} horas e ${(minutesToFinish* (-1))%60} minutos de trabalho`);
  }
}

const parse = (horario) => {
  let [hora, minuto] = horario.split(':').map(v => parseInt(v));
  
  if(isNaN(hora)) hora = (new Date).getHours();
  if(isNaN(minuto)) minuto = (new Date).getMinutes();

  if(!minuto) minuto = 0;
  
  return minuto + (hora * 60);
}

const appendContent = (workedHours) => {
  const tableBody = popupDocument.getElementById('table-body');
  tableBody.innerHtml = [...workedHours].map(data => (
    `<div class="table--row">
      <div class="table--item">${data.querySelector('td:nth-child(1)').innerText}</div>
      <div class="table--item">${data.querySelector('td:nth-child(2)').innerText}</div>
      <div class="table--item">${data.querySelector('td:nth-child(3)').innerText}</div>
    </div>`
  ));
}

(() => {
  updateWorkedHours();
})();