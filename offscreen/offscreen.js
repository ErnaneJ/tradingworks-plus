setInterval(() => chrome.runtime.sendMessage({ keepAlive: true }), 1000);

updateWorkedHours();

async function updateWorkedHours(){
  const defaultInformations = {
    workInformations: true,
    informations: { isDefault: true }
  }

  chrome.runtime.sendMessage(defaultInformations)

  const config = JSON.parse(localStorage.getItem('tradingworks-plus-data'));

  if(!config) return setTimeout(updateWorkedHours, 120000);
  
  const html = await getUpdatedHTML();

  if(html.includes('Entre com seus dados')) return setScreen('not-signed-in');

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const workedHours = doc.querySelectorAll('table tbody tr');
  const tableRows = [...workedHours].map(data => (
    [ data.querySelector('td:nth-child(2)').innerText, data.querySelector('td:nth-child(3)').innerText, data.querySelector('td:nth-child(4)').innerText ]
  ));

  if(workedHours.length === 0) return setScreen('not-started');

  setScreen('started');
  
  const isWorking = tableRows.slice(-1)[0].slice(1)?.join(',').includes("__:__");
  let workedTimes = timeCrawler(workedHours);
      workedTimes = calculatesBreaks(workedTimes, isWorking);
  
  const totalWorkedTime = workedTimes.map(time => time.worked.workedMinutes).reduce((total, currentTime) => total + currentTime, 0);
  let totalBreakTime = workedTimes.map(time => time.break).reduce((total, currentTime) => total + currentTime, 0);

  if(!isWorking && totalWorkedTime <= passTimeInStringToMinutes(config['work-time'])){
    const lastWorkedTimeEnd = workedTimes.slice(-1)[0].worked.endInText;
    const currentDate = new Date();
    const lastWorkedTimeEndInMinutes = passTimeInStringToMinutes(lastWorkedTimeEnd);
    const nowInMinutes = passTimeInStringToMinutes(`${currentDate.getHours()}:${currentDate.getMinutes()}`);
    totalBreakTime += nowInMinutes - lastWorkedTimeEndInMinutes;
  }
  
  const workInformations = {
    workInformations: true,
    informations: {
      workedTimes,
      totalWorkedTime, totalBreakTime,
      tableRows, 
      isWorking: isWorking
    }
  }

  chrome.runtime.sendMessage(workInformations)

  setTimeout(updateWorkedHours, 60000);
}

function timeCrawler(workedHours){
  return [...workedHours].map((workedHour, index) => {
    const start = workedHour.querySelector('td:nth-child(2)').innerText;
    const end = workedHour.querySelector('td:nth-child(3)').innerText;
    
    return {worked: { startInText: start, endInText: end, workedMinutes: passTimeInStringToMinutes(end) - passTimeInStringToMinutes(start) }, break: 0}
  });
}

function calculatesBreaks(workedTimes){
  return workedTimes.map((currentTime, index) => {
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

async function getUpdatedHTML(){
  setScreen('loading');
  const html = await fetch("https://app.tradingworks.net/")
    .then(data => data.text())
    .then(text => text);

  return html;
}

async function setScreen(screen) {
  await chrome.runtime.sendMessage({ changeScreen: true, screen: screen });
}