import _ from 'lodash';
import {
  downloadArrayBuffer as downloadAsFile,
} from '../utils';
import {
  Workspace,
  type WorkspaceExportConfig,
  type WorkspaceInputConfig,
} from '../workspace/Workspace';

const ext = 'phx';

export class Editor {
  protected editorSession: {
    currentWorkspace: Workspace;
    documentName?: string;
  } | null = null;

  async saveFile(data: string, filename: string) {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename, { create: true });
    const accessHandle = await fileHandle.createWritable();

    accessHandle.write(data);
    accessHandle.close();
  }

  async loadFile(filename: string) {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const fileDataString = await file.text();
    return fileDataString;
  }

  async saveDocument(name: string, workspace: Workspace) {
    try {
      const workspaceData = workspace.exportData();
      const dataString = JSON.stringify(workspaceData);
      await this.saveFile(dataString, `${name}.${ext}`);
      localStorage.setItem('last_doc', name);
      alert('Document saved');
    } catch (error) {
      console.error(`saveDocument error: ${error}`);
    }
  }

  public async loadDocument(name: string) {
    if (!name) {
      throw new Error('Editor.loadDocument error: Empty name provided.');
    }

    const filename = `${name}.${ext}`;
    const fileData = await this.loadFile(filename);

    if (!fileData) {
      throw new Error(
        `Editor.loadDocument error: No file with filename ${filename} found`,
      );
    }

    const documentData = JSON.parse(fileData) as WorkspaceExportConfig;

    // TODO check if valid structure
    // TODO How to handle versions of documents?

    await this.startSession(documentData, name);
  }

  /* To be implemented by users extending the Editor class */
  protected mountLayout() {
    if(this.editorSession) {   
      document.body.appendChild(this.editorSession.currentWorkspace.drawboard.element)
    }
  }

  protected async saveDocumentCommand() {
    if (!this.editorSession) {
      console.error('exportPhoxelisCommand: No active editor session.');
      return;
    }

    if (!this.editorSession.documentName) {
      const docName = prompt();

      if (!docName) {
        alert('No name provided. Not saving');
        return;
      }

      this.editorSession.documentName = docName;
    }
    await this.saveDocument(
      this.editorSession.documentName,
      this.editorSession.currentWorkspace,
    );
  }

  async loadDocumentCommand() {
    const docName = prompt();

    if (!docName) {
      alert('No name provided. Not saving');
      return;
    }

    try {
      await this.loadDocument(docName);
    } catch (error) {
      console.error(error);
    }
  }

  protected async newDocumentCommand() {
    await this.startSession();
  }

  protected exportPhoxelisCommand() {
    if (!this.editorSession) {
      console.error('exportPhoxelisCommand: No active editor session.');
      return;
    }

    downloadAsFile(
      JSON.stringify(this.editorSession.currentWorkspace.exportPhoxelis()),
      `${this.editorSession.documentName ?? 'untitled'}.phoxelis`,
    );
  }

  public async startSession(
    config: WorkspaceInputConfig = {
      size: { rows: 37, cols: 152 },
      fontName: '1_Trithemius8x16',
    },
    name?: string,
  ) {
    if (this.editorSession) {
      this.editorSession.currentWorkspace.dispose();
    }

    const ws = await Workspace.create(config);

    this.editorSession = {
      currentWorkspace: ws,
      documentName: name,
    };

    this.mountLayout();

    ws.drawboard.startPanzoom();

    // Hotkeys
    ws.hotkeyManager.hotkeys.push({
      ctrl: true,
      key: 's',
      onHotkeyStart: (e) => {
        e.preventDefault();
      },
      onHotkeyEnd: () => {
        this.saveDocumentCommand();
      },
    });
    ws.hotkeyManager.hotkeys.push({
      ctrl: true,
      key: 'o',
      onHotkeyStart: (e) => {
        e.preventDefault();
      },
      onHotkeyEnd: () => {
        this.loadDocumentCommand();
      },
    });
    ws.hotkeyManager.hotkeys.push({
      ctrl: true,
      shift: true,
      key: 'o',
      onHotkeyStart: (e) => {
        e.preventDefault();
      },
      onHotkeyEnd: () => {
        this.newDocumentCommand();
      },
    });
  }
}
