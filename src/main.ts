import './style.css';
import { HtmlEditor } from './editor/HtmlEditor';
import mountSvelteApp from './editor/svelte/mountSvelteApp';

mountSvelteApp();

// const editor = new HtmlEditor();
// const lastDocId = localStorage.getItem('last_doc');
// if (lastDocId) {
//   editor.loadDocument(lastDocId);
// } else {
//   editor.startSession();
// }
