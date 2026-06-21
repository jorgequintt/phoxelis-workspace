import './style.css';
import { Editor } from './workspace/Editor';

const editor = new Editor();
const lastDoc = localStorage.getItem('last_doc');
if (lastDoc) {
  editor.loadDocument(lastDoc);
} else {
  editor.startSession();
}
