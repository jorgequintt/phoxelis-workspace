import './style.css';
import { HtmlEditor } from './workspace/HtmlEditor';

const editor = new HtmlEditor();
const lastDocId = localStorage.getItem('last_doc');
if (lastDocId) {
  editor.loadDocument(lastDocId);
} else {
  editor.startSession();
}
