const port = chrome.runtime.connect({name: "extensionOpen"});

function updateContent(data){
  updateTableTimes(data);
  updateTableTotals(data.totalWorkedTime, data.totalBreakTime);
  updateMsg(data);
  showDate();
  handleButtonConfig();
}

function updateTableTimes(data){
  if(data.isDefault) return;

  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));
  const tableBodyTimes = document.getElementById('table-body-times');

  tableBodyTimes.innerHTML = data.tableRows.map((row, index) => {
    return (`<div class="table--row">
      <div class="table--item">${row[0]}</div>
      <div class="table--item">${row[1]}</div>
      <div class="table--item">${String(Math.floor(data.workedTimes[index].worked.workedMinutes/60)).padStart(2, '0')}h${String(data.workedTimes[index].worked.workedMinutes%60).padStart(2, '0')}m</div>
    </div>` + ((row[2] != "" && (index !== (data.tableRows.length - 1))) ? `
    <div class="table--row">
      <div class="table--item break">
        Pausa de ${String(Math.floor(data.workedTimes[index + 1]?.break/60)).padStart(2, '0')}h${String(data.workedTimes[index + 1]?.break%60).padStart(2, '0')}m
      </div>
    </div>` : ''))
  }).join('');

  if(!data.isWorking && data.totalWorkedTime < passTimeInStringToMinutes(config['work-time'])) {
    const lastWorkedTimeEnd = data.workedTimes.slice(-1)[0].worked.endInText;
    const currentDate = new Date();
    const lastWorkedTimeEndInMinutes = passTimeInStringToMinutes(lastWorkedTimeEnd);
    const nowInMinutes = passTimeInStringToMinutes(`${currentDate.getHours()}:${currentDate.getMinutes()}`);
    const currentBreakTime = nowInMinutes - lastWorkedTimeEndInMinutes;

    const totalBreakTime = data.totalBreakTime + currentBreakTime;
    const breakInformedTime = passTimeInStringToMinutes(config['break-time']);

    tableBodyTimes.innerHTML += `
      <div class="table--row">
        <div class="table--item break" ${totalBreakTime >= breakInformedTime && 'style="color: red;'}">
          Em pausa por ${String(Math.floor(currentBreakTime/60)).padStart(2, '0')}:${String(currentBreakTime%60).padStart(2, '0')} h
        </div>
      </div>
    `;
  }
}

function formatNumber(number){
  return String(Math.floor(number)).padStart(2, '0');
}

function  updateTableTotals(totalWorkedTime, totalBreakTime){
  const totalWorkedHours = document.getElementById('total-worked-hours');
  const totalBreakHours = document.getElementById('total-break-hours');

  totalWorkedHours.innerHTML = `${formatNumber(totalWorkedTime/60)}:${formatNumber(totalWorkedTime%60)} h`;
  totalBreakHours.innerHTML = `${formatNumber(totalBreakTime/60)}:${formatNumber(totalBreakTime%60)} h`;
}

function updateMsg(data){
  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));
  checkConfig(config);
  
  const informedWorkTime = passTimeInStringToMinutes(config['work-time']);
  const minutesToFinish = informedWorkTime - data.totalWorkedTime;
  const date = new Date();
  const outputDate = date.setMinutes(date.getMinutes() + minutesToFinish);
  const estimatedOutputHour = document.getElementById('estimated-output-hour');
  const msg = document.getElementById('msg');
  
  if (minutesToFinish >= 0) {
    msg.innerHTML = `Faltam <strong>${formatNumber(minutesToFinish/60)} hora(s)</strong> e <strong>${minutesToFinish%60} minuto(s)</strong> para o fim do seu expediente de ${config['work-time']} horas. 🎉`;
    estimatedOutputHour.innerHTML = `Estimativa de saída às ${formatDate(new Date(outputDate), 'hhhmin')}`;
  } else if (data.isWorking){
    msg.innerHTML = `Se preparando para as férias? 🏖️ Você ja fez <strong>${formatNumber((minutesToFinish * (-1))/60)} hora(s)</strong> e <strong>${formatNumber((minutesToFinish* (-1))%60)} minuto(s)</strong> extra.`;
    estimatedOutputHour.innerHTML = '';
  } else{
    msg.innerHTML = "Que ótimo dia de trabalho. "
    if(minutesToFinish <= 0) msg.innerHTML += `Você fez <strong>${formatNumber((minutesToFinish * (-1))/60)} hora(s)</strong> e <strong>${formatNumber((minutesToFinish* (-1))%60)} minuto(s)</strong> extra hoje.`
    msg.innerHTML += " Até mais! 👋";
    estimatedOutputHour.innerHTML = '';
  }
}

function showDate(){
  setInterval(() => {
    const date = new Date();
    const dateElement = document.getElementById('current-date');
    dateElement.innerHTML = formatDate(date, 'dd de MM, hh:min:ss');
  });
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


function openConfig(){
  chrome.tabs.create({'url': chrome.runtime.getURL('./config/index.html')}, (tab) => { });
}

function checkConfig(config){
  if(
    !config               ||
    !config['work-time']  ||
    !config['break-time']
  ){
    openConfig();
    window.close();
  } 
}

function passTimeInStringToMinutes(time){
  let [hour, minute] = time.split(':').map(v => parseInt(v));
  
  if(isNaN(hour)) hour = (new Date).getHours();
  if(isNaN(minute)) minute = (new Date).getMinutes();
  
  if(!minute) minute = 0;
  
  return minute + (hour * 60);
}