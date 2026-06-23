import { mount } from 'svelte';
import App from './App.svelte';

function mountSvelteApp() {
  mount(App, {
    target: document.querySelector('#app')!,
  });
}

export default mountSvelteApp;
