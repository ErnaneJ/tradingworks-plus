window.addEventListener('DOMContentLoaded', () => {
  loadFormByData();
  handleSubmit();
});

function loadFormByData(){
  const form = document.querySelector('form');
  const data = JSON.parse(localStorage.getItem('tradingworks-plus-data'));
  if(data){
    form['work-time'].value = data['work-time'] || '';
    form['break-time'].value = data['break-time'] || '';
    form['whatsapp-number'].value = data['whatsapp-number'] || '';
    form['allow-send-messages'].checked = data['allow-send-messages'] === 'on';
    form['api-key'].value = data['api-key'] || '';
  }
}

function handleSubmit(){
  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const formatedData = Object.fromEntries(data.entries());

    localStorage.setItem('tradingworks-plus-data', JSON.stringify(formatedData));

    const button = document.querySelector('button[type="submit"]');
    button.innerHTML = 'Sucesso! 🎉';

    setTimeout(() => {
      button.innerHTML = 'Salvar';
    }, 2000);
  });
}