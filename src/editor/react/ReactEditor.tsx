import { Editor } from '../Editor';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import { openModal } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { SaveDocumentModal } from './compounds/SaveDocumentModal';
import { LoadDocumentModal } from './compounds/LoadDocumentModal';

const appRoot = document.querySelector('#app')!;

export class ReactEditor extends Editor {
  private reactRoot: Root | null = null;

  protected override requestSaveName(): Promise<string | null> {
    return new Promise((resolve) => {
      openModal({
        title: 'Save Document',
        children: <SaveDocumentModal onSubmit={(name) => resolve(name)} />,
        onClose: () => resolve(null),
      });
    });
  }

  protected override requestDocumentToLoad(): Promise<string | null> {
    return new Promise((resolve) => {
      openModal({
        title: 'Load Document',
        children: <LoadDocumentModal onSelect={(name) => resolve(name)} />,
        onClose: () => resolve(null),
      });
    });
  }

  protected override onDocumentSaved(name: string) {
    notifications.show({
      title: 'Document saved',
      message: `Saved "${name}"`,
    });
  }

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
