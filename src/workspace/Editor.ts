import _ from 'lodash';
import {
  fileToBase64,
  downloadArrayBuffer as downloadAsFile,
  toggleFullScreen,
} from '../utils';
import {
  drawModeDefs,
  toolDefs,
  Workspace,
  type DocumentLayer,
  type DrawModeDefinition,
  type ToolDefinition,
  type WorkspaceExportConfig,
  type WorkspaceInputConfig,
  type WorkspaceObj,
} from '../workspace/Workspace';

// MARK: Elements
const appContainer = document.createElement('div');
appContainer.style = 'width: 100%; height: 100%; display: flex; flex-direction: column;';

const navBar = document.createElement('div');
navBar.style = `width: 100%; background: #888888;`;

const content = document.createElement('div');
content.style =
  'width: 100%; display: flex; flex: 1; flex-direction: row; min-height: 0;';

const footer = document.createElement('div');
footer.style = 'overflow-x: scroll;';

const sidebar = document.createElement('div');
sidebar.style = `display: flex; flex-direction: column;`;

const secondLeftSidebar = document.createElement('div');
secondLeftSidebar.style = `
  width: 40px;
  flex-shrink: 0;
  background: #2a2a2a;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
`;

const leftSidebar = document.createElement('div');
leftSidebar.style = `
  width: 40px;
  flex-shrink: 0;
  background: #333;
  border-right: 1px solid #555;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
`;

const layerList = document.createElement('div');
layerList.style.cssText = `
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
`;

const ext = 'phx';

export class Editor {
  private editorSession: {
    currentWorkspace: WorkspaceObj;
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

  async saveDocument(name: string, workspace: WorkspaceObj) {
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

  private cleanLayout() {
    leftSidebar.replaceChildren();
    secondLeftSidebar.replaceChildren();
    layerList.replaceChildren();
    sidebar.replaceChildren();
    content.replaceChildren();
    footer.replaceChildren();
    appContainer.replaceChildren();
    document.body.replaceChildren();
  }

  private mountLayout() {
    if (!this.editorSession) {
      console.error('Editor.mountLayout: No active editorSession.');
      return;
    }

    this.cleanLayout();

    const { currentWorkspace: w } = this.editorSession;

    function renderLayerList() {
      w.getSortedLayers()
        .toReversed()
        .forEach((lid) => {
          let layerEl = layerList.querySelector(`#layer-${lid}`);
          if (!layerEl) {
            layerEl = createLayerElement(lid, w.ds.layers[lid]);
          }
          layerList.appendChild(layerEl);
        });
    }
    renderLayerList();

    function selectLayer(layerId: string) {
      const layerRow = layerList.querySelector(`#layer-${layerId}`);
      if (!layerRow) {
        console.error(`selectLayer error: Could not find layer by id ${layerId}`);
        return;
      }

      w.session.activeLayer = layerId;

      layerList
        .querySelectorAll('.layer-row')
        .forEach((el) => ((el as HTMLDivElement).style.background = '#2a2a2a'));
      (layerRow as HTMLDivElement).style.background = '#7a7a7a';
    }
    selectLayer(w.session.activeLayer);

    const drawModeButtons: HTMLButtonElement[] = [];

    function createDrawModeButton(def: DrawModeDefinition): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.textContent = def.icon;
      btn.title = def.tooltip;
      btn.style.cssText = `
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 3px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
`;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#555';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = w.session.drawMode === def.name ? '#666' : '#444';
      });
      btn.addEventListener('click', () => {
        drawModeButtons.forEach((b) => {
          b.style.background = '#444';
          b.style.borderColor = '#555';
        });
        btn.style.background = '#666';
        btn.style.borderColor = '#888';
        w.session.drawMode = def.name;
      });
      return btn;
    }

    secondLeftSidebar.replaceChildren();
    for (const def of drawModeDefs) {
      const btn = createDrawModeButton(def);
      secondLeftSidebar.appendChild(btn);
      drawModeButtons.push(btn);
    }

    if (drawModeButtons.length > 0) {
      drawModeButtons[0].style.background = '#666';
      drawModeButtons[0].style.borderColor = '#888';
    }

    const createToolButton = (def: ToolDefinition): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.textContent = def.icon;
      btn.title = def.tooltip;
      btn.style.cssText = `
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 3px;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
`;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#555';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background =
          (w.currTool as any)?.tool?.name === def.name ? '#666' : '#444';
      });
      btn.addEventListener('click', () => {
        leftSidebar.querySelectorAll('button').forEach((b) => {
          b.style.background = '#444';
          b.style.borderColor = '#555';
        });
        btn.style.background = '#666';
        btn.style.borderColor = '#888';
        w.setTool(def.name);
      });
      return btn;
    }

    leftSidebar.replaceChildren();
    for (const def of toolDefs) {
      leftSidebar.appendChild(createToolButton(def));
    }

    navBar.replaceChildren();
    const newButton = document.createElement('button');
    newButton.innerHTML = 'New';
    newButton.onclick = async () => {
      await this.newDocumentCommand();
    };
    navBar.appendChild(newButton);

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    saveButton.onclick = () => this.saveDocumentCommand();
    navBar.appendChild(saveButton);

    const loadButton = document.createElement('button');
    loadButton.innerHTML = 'Load';
    loadButton.onclick = () => this.loadDocumentCommand();
    navBar.appendChild(loadButton);

    const fullscreenButton = document.createElement('button');
    fullscreenButton.innerHTML = 'Fullscreen';
    fullscreenButton.onclick = () => toggleFullScreen(document.body);
    navBar.appendChild(fullscreenButton);

    const exportButton = document.createElement('button');
    exportButton.innerHTML = 'Export';
    exportButton.onclick = () => this.exportPhoxelisCommand();
    navBar.appendChild(exportButton);

    const referenceImageButton = document.createElement('input');
    referenceImageButton.type = 'file';
    referenceImageButton.accept = 'image/*';
    referenceImageButton.addEventListener('change', async (e) => {
      if (!e?.target) {
        return;
      }

      if (e.target instanceof HTMLInputElement) {
        const file = e.target.files?.[0]; // Get the selected file

        if (file) {
          // Convert to base64 for storage
          try {
            const base64 = await fileToBase64(file);

            if (!base64) {
              throw new Error('Failed converting image to base64');
            }

            w.setReferenceImage(base64);
          } catch (err) {
            console.error('Failed to load reference image:', err);
          }
        }
      }
    });
    navBar.appendChild(referenceImageButton);
    const moveRefImageToggle = document.createElement('input');
    moveRefImageToggle.type = 'checkbox';
    moveRefImageToggle.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      w.session.movingRefImage = checked;
    });
    navBar.appendChild(moveRefImageToggle);

    const modifyPalettePhoxButton = document.createElement('button');
    modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
    modifyPalettePhoxButton.onclick = () => {
      if (!w.session.paletteData.modifyingPhox) {
        w.session.paletteData.modifyingPhox = true;
        modifyPalettePhoxButton.innerHTML = 'UPDATING PALETTE PHOX';
      } else {
        w.session.paletteData.modifyingPhox = false;
        modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
      }
    };
    navBar.appendChild(modifyPalettePhoxButton);

    const undoButton = document.createElement('button');
    undoButton.innerHTML = 'Undo';
    undoButton.onclick = () => w.undoLastChange();
    navBar.appendChild(undoButton);

    const redoButton = document.createElement('button');
    redoButton.innerHTML = 'Redo';
    redoButton.onclick = () => w.redoLastChange();
    navBar.appendChild(redoButton);

    const layerPanel = document.createElement('div');
    layerPanel.style.cssText = `
padding: 8px;
border-top: 1px solid #444;
background: #1e1e1e;
`;

    const layerPanelTitle = document.createElement('div');
    layerPanelTitle.textContent = 'Layers';
    layerPanelTitle.style.cssText = `
font-size: 12px;
font-weight: bold;
color: #aaa;
margin-bottom: 6px;
text-transform: uppercase;
letter-spacing: 0.5px;
`;
    layerPanel.appendChild(layerPanelTitle);

    const layerActions = document.createElement('div');
    layerActions.style.cssText = `
display: flex;
gap: 4px;
margin-bottom: 8px;
`;

    const addLayerBtn = document.createElement('button');
    addLayerBtn.textContent = '+ Add';
    addLayerBtn.style.cssText = `
flex: 1;
padding: 4px 8px;
background: #444;
color: #ccc;
border: 1px solid #555;
border-radius: 3px;
font-size: 11px;
cursor: pointer;
`;
    addLayerBtn.addEventListener('click', () => {
      const layerId = w.createLayer();
      createLayerElement(layerId, w.ds.layers[layerId]);
      selectLayer(layerId);
      renderLayerList();
    });
    layerActions.appendChild(addLayerBtn);

    const removeLayerBtn = document.createElement('button');
    removeLayerBtn.textContent = '− Remove';
    removeLayerBtn.style.cssText = `
flex: 1;
padding: 4px 8px;
background: #444;
color: #ccc;
border: 1px solid #555;
border-radius: 3px;
font-size: 11px;
cursor: pointer;
`;
    removeLayerBtn.addEventListener('click', () => {
      const layerId = w.session.activeLayer;
      w.removeLayer(w.session.activeLayer);
      layerList.removeChild(layerList.querySelector(`#layer-${layerId}`)!);
      renderLayerList();
    });
    layerActions.appendChild(removeLayerBtn);

    layerPanel.appendChild(layerActions);

    function createLayerElement(layerId: string, layer: DocumentLayer) {
      const layerRow = document.createElement('div');
      layerRow.id = `layer-${layerId}`;
      layerRow.classList.add('layer-row');
      layerRow.style.cssText = `
display: flex;
align-items: center;
gap: 4px;
padding: 4px;
background: #2a2a2a;
border: 1px solid #3a3a3a;
border-radius: 3px;
cursor: grab;
user-select: none;
transition: background 0.1s;
`;
      layerRow.addEventListener('click', () => {
        selectLayer(layerId);
      });

      const dragHandle = document.createElement('div');
      dragHandle.style.cssText = `
width: 16px;
height: 28px;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
gap: 2px;
flex-shrink: 0;
cursor: grab;
touch-action: none;
user-select: none;
`;
      dragHandle.innerHTML = `
<span style="font-size: 8px; line-height: 1; color: #666;">⠿</span>
<span style="font-size: 8px; line-height: 1; color: #666;">⠿</span>
`;
      layerRow.appendChild(dragHandle);

      const previewContainer = document.createElement('div');
      previewContainer.style.cssText = `
width: 28px;
height: 28px;
background: #1a1a1a;
border: 1px solid #444;
border-radius: 2px;
flex-shrink: 0;
display: flex;
align-items: center;
justify-content: center;
`;
      previewContainer.appendChild(w.layersTargets[layerId]);
      layerRow.appendChild(previewContainer);

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = layer.name;
      nameInput.style.cssText = `
flex: 1;
min-width: 0;
padding: 2px 4px;
background: #1a1a1a;
border: 1px solid #444;
border-radius: 2px;
color: #ccc;
font-size: 11px;
outline: none;
`;
      nameInput.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement) {
          layer.name = e.target.value;
        }
      });
      layerRow.appendChild(nameInput);

      const opacitySlider = document.createElement('input');
      opacitySlider.type = 'range';
      opacitySlider.min = '0';
      opacitySlider.max = '100';
      opacitySlider.value = String(layer.opacity);
      opacitySlider.style.cssText = `
width: 50px;
height: 4px;
accent-color: #666;
flex-shrink: 0;
`;
      opacitySlider.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement) {
          layer.opacity = parseInt(e.target.value);
        }
      });
      layerRow.appendChild(opacitySlider);

      const eyeBtn = document.createElement('button');
      eyeBtn.textContent = layer.visible ? '👁‍🗨' : '👁';
      eyeBtn.style.cssText = `
width: 24px;
height: 24px;
background: transparent;
border: 1px solid #444;
border-radius: 2px;
font-size: 14px;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
opacity: layer.visible ? 1 : 0.4;
`;
      eyeBtn.addEventListener('click', (e) => {
        layer.visible = !layer.visible;
        eyeBtn.textContent = layer.visible ? '👁‍🗨' : '👁';
        e.stopImmediatePropagation();
      });
      layerRow.appendChild(eyeBtn);

      const dropIndicator = document.createElement('div');
      dropIndicator.setAttribute('data-drop-indicator', 'line');
      dropIndicator.style.cssText = `
position: absolute;
left: -4px;
right: -4px;
height: 3px;
background: #4a9eff;
border-radius: 2px;
pointer-events: none;
opacity: 0;
transition: opacity 0.1s;
`;
      layerRow.style.position = 'relative';
      layerRow.appendChild(dropIndicator);

      let ghost: HTMLElement | null = null;
      let pointerDownRow: HTMLElement | null = null;
      let pointerTargetRow: HTMLElement | null = null;
      let pointerStartX = 0;
      let pointerStartY = 0;
      let isDragging = false;

      function reorderRows(
        source: HTMLElement,
        target: HTMLElement,
        insertAbove: boolean,
      ) {
        const rows = (Array.from(layerList.children) as HTMLElement[]).toReversed();
        const dragIdx = rows.indexOf(source);
        const targetIdx = rows.indexOf(target);
        if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;

        const adjustedTarget = dragIdx < targetIdx ? targetIdx - 1 : targetIdx;
        const insertIdx = insertAbove ? adjustedTarget : adjustedTarget + 1;

        w.moveLayer(w.getSortedLayers()[dragIdx], insertIdx);

        renderLayerList();
      }

      function showIndicator(row: HTMLElement, clientY: number) {
        if (pointerTargetRow && pointerTargetRow !== row) {
          const prev = pointerTargetRow.querySelector(
            '[data-drop-indicator]',
          ) as HTMLElement;
          if (prev) prev.style.opacity = '0';
        }

        const indicator = row.querySelector('[data-drop-indicator]') as HTMLElement;
        if (!indicator) return;

        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const above = clientY < midY;
        indicator.style.top = above ? '0' : 'auto';
        indicator.style.bottom = above ? 'auto' : '0';
        indicator.style.opacity = '1';
        pointerTargetRow = row;
      }

      function updateGhost(clientX: number, clientY: number) {
        if (!ghost) return;
        const rowRect = pointerDownRow!.getBoundingClientRect();
        ghost.style.transform = `translate(${clientX - rowRect.left - 8}px, ${clientY - rowRect.top - 14}px)`;
      }

      function findTarget(clientX: number, clientY: number): HTMLElement | null {
        if (!ghost) return null;
        ghost.style.display = 'none';
        const el = document.elementFromPoint(clientX, clientY);
        ghost.style.display = '';
        return el?.closest('.layer-row') ?? null;
      }

      function cleanupDrag() {
        if (ghost) {
          ghost.remove();
          ghost = null;
        }
        if (pointerDownRow) {
          pointerDownRow.style.opacity = '1';
          pointerDownRow.style.zIndex = '';
        }
        if (pointerTargetRow) {
          const indicator = pointerTargetRow.querySelector(
            '[data-drop-indicator]',
          ) as HTMLElement;
          if (indicator) indicator.style.opacity = '0';
        }
        pointerDownRow = null;
        pointerTargetRow = null;
        isDragging = false;
      }

      dragHandle.addEventListener('pointerdown', (e: PointerEvent) => {
        // Only respond to left-click (mouse) or any touch/pen
        if (e.button !== 0 && e.pointerType !== 'touch') return;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        pointerDownRow = layerRow;

        // Set pointer capture so we keep receiving events even if pointer leaves the element
        dragHandle.setPointerCapture(e.pointerId);
      });

      dragHandle.addEventListener('pointermove', (e: PointerEvent) => {
        if (!pointerDownRow) return;

        if (!isDragging) {
          const dx = Math.abs(e.clientX - pointerStartX);
          const dy = Math.abs(e.clientY - pointerStartY);
          // Start dragging only after moving past the threshold
          if (dx < 5 && dy < 5) return; // Still within threshold, do nothing

          isDragging = true;

          ghost = pointerDownRow.cloneNode(true) as HTMLElement;
          ghost.style.position = 'fixed';
          ghost.style.width = `${pointerDownRow.offsetWidth}px`;
          ghost.style.zIndex = '9999';
          ghost.style.opacity = '0.85';
          ghost.style.pointerEvents = 'none';
          ghost.style.transition = 'none';
          ghost.style.transform = `translate(${e.clientX - pointerDownRow.getBoundingClientRect().left - 8}px, ${e.clientY - pointerDownRow.getBoundingClientRect().top - 14}px)`;
          // document.body.appendChild(ghost);

          pointerDownRow.style.opacity = '0.3';
          pointerDownRow.style.zIndex = '100';
        }

        if (isDragging) {
          e.preventDefault();
          updateGhost(e.clientX, e.clientY);

          const target = findTarget(e.clientX, e.clientY);
          if (target && target !== pointerDownRow && target !== pointerTargetRow) {
            showIndicator(target, e.clientY);
          } else if (target === pointerDownRow && pointerTargetRow) {
            const indicator = pointerTargetRow.querySelector(
              '[data-drop-indicator]',
            ) as HTMLElement;
            if (indicator) indicator.style.opacity = '0';
            pointerTargetRow = null;
          }
        }
      });

      dragHandle.addEventListener('pointerup', (e: PointerEvent) => {
        if (!pointerDownRow) return;

        if (isDragging) {
          if (pointerTargetRow) {
            reorderRows(
              pointerDownRow,
              pointerTargetRow,
              e.clientY >
                pointerTargetRow.getBoundingClientRect().top +
                  pointerTargetRow.getBoundingClientRect().height / 2,
            );
          }
          cleanupDrag();
        }

        // Release pointer capture
        try {
          dragHandle.releasePointerCapture(e.pointerId);
        } catch {}
        pointerDownRow = null;
      });

      dragHandle.addEventListener('pointercancel', () => {
        cleanupDrag();
        try {
          dragHandle.releasePointerCapture(0);
        } catch {}
      });

      layerList.appendChild(layerRow);
      return layerRow;
    }

    // layerList.replaceChildren();
    layerPanel.appendChild(layerList);
    sidebar.appendChild(w.alphabet);
    sidebar.appendChild(w.colorPicker);
    sidebar.appendChild(layerPanel);

    content.appendChild(secondLeftSidebar);
    content.appendChild(leftSidebar);
    content.appendChild(w.drawboard);
    content.appendChild(sidebar);

    footer.appendChild(w.paletteSelector);

    appContainer.appendChild(navBar);
    appContainer.appendChild(content);
    appContainer.appendChild(footer);
    document.body.appendChild(appContainer);
  }

  async saveDocumentCommand() {
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

  async newDocumentCommand() {
    await this.startSession();
  }

  exportPhoxelisCommand() {
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

    const workspace = await Workspace(config);

    this.editorSession = {
      currentWorkspace: workspace,
      documentName: name,
    };

    this.mountLayout();

    workspace.startPanzoom();

    // Hotkeys
    workspace.hotkeys.push({
      ctrl: true,
      key: 's',
      onHotkeyStart: (e) => {
        e.preventDefault();
      },
      onHotkeyEnd: () => {
        this.saveDocumentCommand();
      },
    });
    workspace.hotkeys.push({
      ctrl: true,
      key: 'o',
      onHotkeyStart: (e) => {
        e.preventDefault();
      },
      onHotkeyEnd: () => {
        this.loadDocumentCommand();
      },
    });
    workspace.hotkeys.push({
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
