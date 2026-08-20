import _ from 'lodash';
import {
  downloadArrayBuffer as downloadAsFile,
  downloadBlob,
  fileToBase64,
  promptForFile,
} from '../utils/general';
import { scaleCanvas } from '../utils/rendering';
import { setLastDocument } from '../utils/session';
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

  async listDocuments() {
    const root = await navigator.storage.getDirectory();
    const names: string[] = [];
    for await (const [name] of root.entries()) {
      if (name.endsWith(`.${ext}`)) {
        names.push(name.slice(0, -(ext.length + 1)));
      }
    }
    return names.sort();
  }

  async deleteDocument(name: string) {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(`${name}.${ext}`);
  }

  async saveDocument(name: string, workspace: Workspace) {
    try {
      const workspaceData = workspace.exportData();
      const dataString = JSON.stringify(workspaceData);
      await this.saveFile(dataString, `${name}.${ext}`);
      setLastDocument(name);
      return true;
    } catch (error) {
      console.error(`saveDocument error: ${error}`);
      return false;
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
    if (this.editorSession) {
      document.body.appendChild(this.editorSession.currentWorkspace.drawboard.element);
    }
  }

  /* Hooks to be overridden by extending UIs to replace browser prompts/alerts */
  protected async requestSaveName(): Promise<string | null> {
    return prompt();
  }

  protected async requestDocumentToLoad(): Promise<string | null> {
    return prompt();
  }

  protected onDocumentSaved(_name: string) {
    alert('Document saved');
  }

  public async saveDocumentCommand() {
    if (!this.editorSession) {
      console.error('exportPhoxelisCommand: No active editor session.');
      return;
    }

    if (!this.editorSession.documentName) {
      const docName = await this.requestSaveName();

      if (!docName) {
        return;
      }

      this.editorSession.documentName = docName;
    }
    const saved = await this.saveDocument(
      this.editorSession.documentName,
      this.editorSession.currentWorkspace,
    );
    if (saved) {
      this.onDocumentSaved(this.editorSession.documentName);
    }
  }

  async loadDocumentCommand() {
    const docName = await this.requestDocumentToLoad();

    if (!docName) {
      return;
    }

    try {
      await this.loadDocument(docName);
    } catch (error) {
      console.error(error);
    }
  }

  public async newDocumentCommand() {
    await this.startSession();
  }

  public exportPngCommand(scale: number) {
    if (!this.editorSession) {
      console.error('exportPngCommand: No active editor session.');
      return;
    }

    const canvas = scaleCanvas(
      this.editorSession.currentWorkspace.phoxelis.canvas,
      scale,
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(
        blob,
        `${this.editorSession?.documentName ?? 'untitled'}.png`,
      );
    }, 'image/png');
  }

  public exportPhoxelisCommand() {
    if (!this.editorSession) {
      console.error('exportPhoxelisCommand: No active editor session.');
      return;
    }

    downloadAsFile(
      JSON.stringify(this.editorSession.currentWorkspace.exportPhoxelis()),
      `${this.editorSession.documentName ?? 'untitled'}.phoxelis`,
    );
  }

  public async addReferenceImageCommand() {
    if (!this.editorSession?.currentWorkspace) {
      console.error(
        'addReferenceImage error: No current workspace to add reference image',
      );
      return;
    }

    const file = await promptForFile();

    if (!file) {
      console.error('addReferenceImage: No file selected');
      return;
    }

    const base64 = await fileToBase64(file);

    if (!base64) {
      console.error('addReferenceImage error: Failed converting image to base64');
      return;
    }

    this.editorSession?.currentWorkspace.drawboard.setReferenceImage(base64);
  }

  public async toggleModifyPalettePhoxCommand() {
    if (!this.editorSession?.currentWorkspace) {
      console.error('toggleModifyPalettePhox error: No current workspace');
      return;
    }
    const modifyingPhox =
      this.editorSession.currentWorkspace.state$.paletteData.modifyingPhox;
    modifyingPhox.set(!modifyingPhox.get());
  }

  public async toggleMovingRefImage() {
    if (!this.editorSession?.currentWorkspace) {
      console.error('toggleMovingRefImage error: No current workspace');
      return;
    }
    const movingRefImage = this.editorSession.currentWorkspace.state$.movingRefImage;
    movingRefImage.set(!movingRefImage.get());
  }

  public async toggleFullScreenCommand() {
    if (!document.fullscreenElement) {
      document.body.requestFullscreen();
    } else {
      document.exitFullscreen?.();
    }
  }

  public async createWorkspace(config: WorkspaceInputConfig) {
    return await Workspace.create(config);
  }

  public async startSession(
    config: WorkspaceInputConfig = {
      size: { rows: 37, cols: 152 },
      fontName: '1_Trithemius8x16',
    },
    documentName?: string,
  ) {
    if (this.editorSession) {
      this.editorSession.currentWorkspace.dispose();
    }

    const ws = await this.createWorkspace(config);

    this.editorSession = {
      currentWorkspace: ws,
      documentName,
    };

    this.mountLayout();

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
