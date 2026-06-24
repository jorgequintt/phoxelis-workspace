import { mount } from 'svelte';
import App from './App.svelte';
import type { Workspace } from '../../workspace/Workspace';
import type { SvelteEditor } from './SvelteEditor';

function mountSvelteApp(root: Element, ws: Workspace, ed: SvelteEditor) {
  mount(App, {
    target: root,
    props: { ws, ed }
  });
}

export default mountSvelteApp;
