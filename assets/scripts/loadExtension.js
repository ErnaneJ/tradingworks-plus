async function updateWorkedHours(){
  const html = await getUpdatedHTML();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const workedHours = doc.querySelectorAll('table tbody tr');

  if(workedHours.length === 0 && !doc.title.includes('Gestão inteligente')){
    console.log('Ops.. Algo deu errado! 🤔');
    chrome.tabs.create({'url': "https://app.tradingworks.net/"}, (tab) => { });
    return false;
  }
  
  let workedTimes = timeCrawler(workedHours);
      workedTimes = calculatesBreaks(workedTimes);
  
  const totalWorkedTime = workedTimes.map(time => time.worked.workedMinutes).reduce((total, currentTime) => total + currentTime, 0);
  const totalBreakTime = workedTimes.map(time => time.break).reduce((total, currentTime) => total + currentTime, 0);

  const workInformations = {
    workedHours, workedTimes,
    totalWorkedTime, totalBreakTime
  }

  requestUpdatePopup(workInformations);

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

async function requestUpdatePopup(infoToUpdate){
  const tableRows = [...infoToUpdate.workedHours].map(data => (
    [ data.querySelector('td:nth-child(2)').innerText, data.querySelector('td:nth-child(3)').innerText, data.querySelector('td:nth-child(4)').innerText ]
  ));

  updateContent({...infoToUpdate, tableRows});
}

async function getUpdatedHTML(){
  const response = await fetch("https://app.tradingworks.net/");

  return await response.text();
}