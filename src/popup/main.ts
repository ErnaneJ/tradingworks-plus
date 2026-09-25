import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Popup root element not found');

new App({ target });
