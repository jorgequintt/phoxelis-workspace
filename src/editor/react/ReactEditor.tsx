import { Editor } from '../Editor';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';

const appRoot = document.querySelector('#app')!;

export class ReactEditor extends Editor {
  private reactRoot: Root | null = null;

  public cleanLayout() {
    this.reactRoot?.unmount();
    appRoot.replaceChildren();
    this.reactRoot = null;
  }

  public override mountLayout() {
    if (!this.editorSession) {
      console.error('Editor.mountLayout: No active editorSession.');
      return;
    }

    this.cleanLayout();

    const { currentWorkspace: ws } = this.editorSession;

    this.reactRoot = createRoot(appRoot);
    this.reactRoot.render(<App ws={ws} ed={this} />);
  }
}
