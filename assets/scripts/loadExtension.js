async function updateWorkedHours(){
  const html = await getUpdatedHTML();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  clearTimeout(window.timerTWP);

  const workedHours = doc.querySelectorAll('table tbody tr');

  if(workedHours.length === 0 && !doc.title.includes('Gestão inteligente')){
    return console.log('Ops.. Algo deu errado! 🤔');
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
  const config = JSON.parse(window.localStorage.getItem('tradingworks-plus-data'));
  const response = await fetch("https://app.tradingworks.net/Account/Login.aspx?ReturnUrl=%2F", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "pt,en-US;q=0.9,en;q=0.8,es;q=0.7",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1"
    },
    "referrer": "https://app.tradingworks.net/Account/Login.aspx?ReturnUrl=%2F",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": `__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATE=3zvT6jbTY8XIs%2FBIVwV9tSUGjfElMeMOtXGJysBEsrz0S2QrmuNtfZ%2FfFHlaW9dY0I%2FJ2oGrJGhqU1DMCF87RWSt60ysPihAWGb3XDhIDpJfyHEuk7T38886W6t%2B90oXhrgH9%2FomiRegxVxfERXDNA1UZNceI2Gy1J8qkReJ7ejDn3oIC2d2O6XnPbygFoSevvB3%2Bnf0IbWekQSmpiOsr5CWmGhH6WkgMMTGRE%2BNLqlO3hJU&__VIEWSTATEGENERATOR=CD85D8D2&__EVENTVALIDATION=WuOhqI%2FblLzrUYRCHTu4dzp3Hm1MmLGTU9lWyWiRgTHslr4e50Q7dOk3k8bEfZEKHy926YcK7Y5d2X8ot3rUOKbMXH0Z79ISps65KE2hM9A%2FuelCOd7nm4qjCvpcyXLI1WxpiM16udNv%2Beo%2FrpSRnw6E3WbXqWFPtBqi7JnPpf3ju9ioO77LBAYMXHf5GtIVZINgfviKCh%2BKp1b1CpCQ4nwthuo%3D&ctl00%24ctl00%24Body%24Body%24txtUserName=${config['email']}&ctl00%24ctl00%24Body%24Body%24chkRememberUserName=on&ctl00%24ctl00%24Body%24Body%24txtPassword=${config['password']}&ctl00%24ctl00%24Body%24Body%24chkRememberMe=on&ctl00%24ctl00%24Body%24Body%24LoginButton=Entrar`,
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  });

  return await response.text();
}