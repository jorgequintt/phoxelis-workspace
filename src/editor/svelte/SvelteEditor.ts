import _ from 'lodash';
import { Editor } from '../Editor';
import mountSvelteApp from './mountSvelteApp';

const appRoot = document.querySelector('#app')!;

export class SvelteEditor extends Editor {
  private cleanLayout() {
  }

  protected override mountLayout() {
    if (!this.editorSession) {
      console.error('Editor.mountLayout: No active editorSession.');
      return;
    }

    this.cleanLayout();

    const { currentWorkspace: w } = this.editorSession;

    mountSvelteApp(appRoot, w, this);
    // w.drawboard.startPanzoom(); // TODO uncomment when drawboard added to app, or even add internally
  }
}
