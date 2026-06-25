import './style.css';
import { HtmlEditor } from './editor/html/HtmlEditor';
import { ReactEditor } from './editor/react/ReactEditor';

// const editor = new HtmlEditor();
const editor = new ReactEditor();
const lastDocId = localStorage.getItem('last_doc');
if (lastDocId) {
  editor.loadDocument(lastDocId);
} else {
  editor.startSession();
}
