import './style.css';
import { SvelteEditor } from './editor/svelte/SvelteEditor';

const editor = new SvelteEditor();
const lastDocId = localStorage.getItem('last_doc');
if (lastDocId) {
  editor.loadDocument(lastDocId);
} else {
  editor.startSession();
}
