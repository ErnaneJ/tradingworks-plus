import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('Options root element not found');

new App({ target });
