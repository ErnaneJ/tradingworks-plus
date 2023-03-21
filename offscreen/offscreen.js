setInterval(() => chrome.runtime.sendMessage({ keepAlive: true }), 1000);

updateWorkedHours();

async function updateWorkedHours(){
  const html = await getUpdatedHTML();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const workedHours = doc.querySelectorAll('table tbody tr');
  const tableRows = [...workedHours].map(data => (
    [ data.querySelector('td:nth-child(2)').innerText, data.querySelector('td:nth-child(3)').innerText, data.querySelector('td:nth-child(4)').innerText ]
  ));

  if(workedHours.length === 0 && !doc.title.includes('Gestão inteligente')){
    chrome.runtime.sendMessage({ debug: "true", data: 'Ops.. Algo deu errado! 🤔' })
    return setTimeout(updateWorkedHours, 120000);
  }
  
  let workedTimes = timeCrawler(workedHours);
      workedTimes = calculatesBreaks(workedTimes);
  
  const totalWorkedTime = workedTimes.map(time => time.worked.workedMinutes).reduce((total, currentTime) => total + currentTime, 0);
  const totalBreakTime = workedTimes.map(time => time.break).reduce((total, currentTime) => total + currentTime, 0);

  const workInformations = {
    workInformations: true,
    informations: {
      workedTimes,
      totalWorkedTime, totalBreakTime,
      tableRows
    }
  }

  chrome.runtime.sendMessage(workInformations);

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
  const response = await fetch("https://app.tradingworks.net/");

  return await response.text();
}