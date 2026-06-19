import '../style.css';
import _ from 'lodash';
import { downloadArrayBuffer as downloadAsFile, toggleFullScreen } from '../utils';
import {
  saveRefImageToStorage,
  // loadRefImageFromStorage,
  // saveRefImagePanzoomConfig,
  // loadRefImagePanzoomConfig,
  // clearRefImageStorage,
  fileToBase64,
} from '../refImageStorage';
import { drawModeDefs, toolDefs, Workspace, type DocumentLayer, type DrawModeDefinition, type ToolDefinition } from '../workspace/Workspace';

// import React, { useEffect, useRef, useState } from 'react';
// import ReactDOM from 'react-dom/client';

// // TODO doc.layers as proxy. Decouple react from what exists rn
// import { proxy } from 'valtio';

const layerList = document.createElement('div');
layerList.style.cssText = `
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
`;

const workspace = await Workspace({
  size: { rows: 37, cols: 152 },
  filename: 'test_file',
  fontName: '1_Trithemius8x16',
});

const { ws, session, filename } = workspace;

function renderLayerList() {
  ws.phoxelis.layers.toReversed().forEach((l) => {
    let layerEl = layerList.querySelector(`#layer-${l.id}`);
    if (!layerEl) {
      layerEl = createLayerElement(ws.layers[l.id]);
    }
    layerList.appendChild(layerEl);
  });
}

// MARK: Html Elements

// function App() {
//   return (
//     <div
//       style={{
//         width: '100%',
//         height: '100%',
//         display: 'flex',
//         flexDirection: 'column',
//       }}
//     >
//       <NavBar />
//       <Content />
//       <Footer />
//     </div>
//   );
// }

const appContainer = document.createElement('div');
appContainer.style = 'width: 100%; height: 100%; display: flex; flex-direction: column;';

// function NavBar(props: { children?: React.ReactNode }) {
//   return (
//     <div
//       style={{
//         width: '100%',
//         background: '#888888',
//       }}
//     >
//       {props.children}
//     </div>
//   );
// }

const navBar = document.createElement('div');
navBar.style = `width: 100%; background: #888888;`;

// function Content(props: { children?: React.ReactNode }) {
//   return (
//     <div
//       style={{
//         width: '100%',
//         display: 'flex',
//         flex: 1,
//         flexDirection: 'row',
//         minHeight: 0,
//       }}
//     >
//       {props.children}
//     </div>
//   );
// }

const content = document.createElement('div');
content.style =
  'width: 100%; display: flex; flex: 1; flex-direction: row; min-height: 0;';

// function Footer() {
//   return (
//     <div style={{ overflowX: 'scroll' }}>
//       <PaletteSelector />
//     </div>
//   );
// }

const footer = document.createElement('div');
footer.style = 'overflow-x: scroll;';

// function PaletteSelector() {
//   const paletteScaledHeight = doc.font.height * paletteScale;

//   return (
//     <div style={{ position: 'relative' }}>
//       <Palette paletteScaledHeight={paletteScaledHeight} />
//       <PaletteOverlayCanvas paletteScaledHeight={paletteScaledHeight} />
//     </div>
//   );
// }

// function Palette(props: { paletteScaledHeight: number }) {
//   const containerRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     // MOUNT PALETTE CANVAS
//     if (!containerRef.current) {
//       console.error('PaletteSelector warn: No container ref to mount palette canvas');
//       return;
//     }

//     doc.phoxelis.palette.style = `height: ${props.paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
//     containerRef.current.appendChild(doc.phoxelis.palette);

//     return () => {
//       if (containerRef.current) {
//         containerRef.current.removeChild(doc.phoxelis.palette);
//       }
//     };
//   }, []);

//   return <div ref={containerRef}></div>;
// }

// const paletteWrapper = document.createElement('div');
// paletteWrapper.style = 'position: relative;';

// function PaletteOverlayCanvas(props: { paletteScaledHeight: number }) {
//   const paletteCanvasRef = useRef<HTMLCanvasElement | null>(null);

//   return (
//     <canvas
//       onClick={(e) => onPaletteOverlayClick(e.nativeEvent, paletteCanvasRef.current)}
//       style={{
//         height: props.paletteScaledHeight,
//         border: '1px solid black',
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         imageRendering: 'pixelated',
//       }}
//       ref={paletteCanvasRef}
//       width={doc.phoxelis.palette.width}
//       height={doc.phoxelis.palette.height}
//     />
//   );
// }

// const paletteWrapper = document.createElement('div');
// paletteWrapper.style = 'position: relative;';
// const paletteOverlay = document.createElement('canvas');
// paletteOverlay.width = doc.phoxelis.palette.width;
// paletteOverlay.height = doc.phoxelis.palette.height;
// const paletteScaledHeight = doc.font.height * paletteScale;
// doc.phoxelis.palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
// paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
// const onPaletteOverlayClick = (
//   e: MouseEvent,
//   paletteOverlay: HTMLCanvasElement | null,
// ) => {
//   if (!paletteOverlay) {
//     console.error(
//       'onPaletteOverlayClick error: null "paletteOverlay" was passed as param.',
//     );
//     return;
//   }

//   const x = e.offsetX;
//   const paletteMaxCells = doc.phoxelis.palette.width / doc.font.width;
//   const pos = Math.floor(
//     (x / (paletteScale * doc.phoxelis.palette.width)) * paletteMaxCells,
//   );
//   const phox = doc.phoxelis.getPhoxFromPaletteIndex(pos);

//   if (!phox) {
//     console.warn('Null Phox selected. Omitting selection');
//     return;
//   }
//   session.dp = phox;
//   session.paletteData.selectedPhox = pos;

//   colorPicker.color.hexString = session.dp[session.selectedColorType];
//   selectCharInAlphabet(
//     doc.font.charactersList.findIndex(
//       (c) => c.codepoint === session.dp.char.codePointAt(0),
//     ),
//   );

//   const ctx = paletteOverlay.getContext('2d');
//   ctx!.reset();
//   ctx!.strokeStyle = 'green';
//   ctx!.lineWidth = 2;
//   ctx!.strokeRect(pos * doc.font.width, 0, doc.font.width, doc.font.height);
// };
// paletteOverlay.addEventListener('click', onPaletteOverlayClick);
// paletteWrapper.append(doc.phoxelis.palette);
// paletteWrapper.append(paletteOverlay);

footer.append(workspace.paletteSelector);

// function Sidebar(props: { children?: React.ReactNode }) {
//   return <div style={{ display: 'flex', flexDirection: 'column' }}></div>;
// }

const sidebar = document.createElement('div');
sidebar.style = `display: flex; flex-direction: column;`;

// ─── Left Sidebar (Tool Selector) ────────────────────────────────────────────
const drawModeButtons: HTMLButtonElement[] = [];

// function DrawModeButton({ def }: { def: DrawModeDefinition }) {
//   // TOD listen for session.drawMode

//   return (
//     <button
//       title={def.tooltip}
//       style={{
//         background: session.drawMode === def.name ? '#666' : '#444',
//         color: '#ccc',
//         border: `1px solid ${session.drawMode === def.name ? '#888' : '#555'}`,
//         borderRadius: '3px',
//         width: '36px',
//         height: '36px',
//         fontSize: '18px',
//         cursor: 'pointer',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         transition: 'background 0.15s, border-color 0.15s',
//       }}
//       onMouseEnter={(e) => {
//         if (session.drawMode !== def.name) {
//           e.currentTarget.style.background = '#555';
//         }
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.background =
//           session.drawMode === def.name ? '#666' : '#444';
//         e.currentTarget.style.borderColor =
//           session.drawMode === def.name ? '#888' : '#555';
//       }}
//       onClick={() => {
//         session.drawMode = def.name;
//       }}
//     >
//       {def.icon}
//     </button>
//   );
// }

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
    btn.style.background = session.drawMode === def.name ? '#666' : '#444';
  });
  btn.addEventListener('click', () => {
    drawModeButtons.forEach((b) => {
      b.style.background = '#444';
      b.style.borderColor = '#555';
    });
    btn.style.background = '#666';
    btn.style.borderColor = '#888';
    session.drawMode = def.name;
  });
  return btn;
}

// function DrawModeMenu(props: {}) {
//   return (
//     <div>
//       {drawModeDefs.map((d) => (
//         <DrawModeButton key={d.name} def={d} />
//       ))}
//     </div>
//   );
// }

// ─── Left Sidebar (Draw Mode Selector) ───────────────────────────────────────
const drawModeSidebar = document.createElement('div');
drawModeSidebar.style = `
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

for (const def of drawModeDefs) {
  const btn = createDrawModeButton(def);
  drawModeSidebar.appendChild(btn);
  drawModeButtons.push(btn);
}

// Set initial active state for 'draw' mode
if (drawModeButtons.length > 0) {
  drawModeButtons[0].style.background = '#666';
  drawModeButtons[0].style.borderColor = '#888';
}

// ─── Left Sidebar (Tool Selector) ────────────────────────────────────────────
const leftSidebar = document.createElement('div');
leftSidebar.style = `
  width: 48px;
  flex-shrink: 0;
  background: #333;
  border-right: 1px solid #555;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
`;


// function resetWorkspace() {
//   layerList.replaceChildren(); // removes all nodes
// }


function createToolButton(def: ToolDefinition): HTMLButtonElement {
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
    // TODO fix currTool type
    btn.style.background =
      (workspace.currTool as any).tool.name === def.name ? '#666' : '#444';
  });
  btn.addEventListener('click', () => {
    // Remove active state from all buttons
    leftSidebar.querySelectorAll('button').forEach((b) => {
      b.style.background = '#444';
      b.style.borderColor = '#555';
    });
    // Set active state
    btn.style.background = '#666';
    btn.style.borderColor = '#888';
    workspace.setTool(def.name);
  });
  return btn;
}

// interface ToolButtonProps {
//   def: ToolDefinition;
//   currentToolName?: string;
// }

// const ToolButton: React.FC<ToolButtonProps> = ({ def, currentToolName }) => {
//   const [isHovered, setIsHovered] = useState(false);

//   const isActive = currentToolName === def.name;
//   const getBackgroundColor = () => {
//     if (isActive) return '#666';
//     if (isHovered) return '#555';
//     return '#444';
//   };

//   const getBorderColor = () => {
//     if (isActive) return '#888';
//     return '#555';
//   };

//   const handleClick = () => {
//     setTool(def.getTool());
//   };

//   return (
//     <button
//       title={def.tooltip}
//       onClick={handleClick}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//       style={{
//         background: getBackgroundColor(),
//         color: '#ccc',
//         border: `1px solid ${getBorderColor()}`,
//         borderRadius: '3px',
//         width: '36px',
//         height: '36px',
//         fontSize: '18px',
//         cursor: 'pointer',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         transition: 'background 0.15s, border-color 0.15s',
//       }}
//     >
//       {def.icon}
//     </button>
//   );
// };

// function ToolMenu() {
//   // TODO currTool as a snap for reactivity

//   return (
//     <div>
//       {toolDefs.map((t) => (
//         <ToolButton
//           def={t}
//           currentToolName={currTool?.tool.name}
//           key={currTool?.tool.name}
//         />
//       ))}
//     </div>
//   );
// }

for (const def of toolDefs) {
  leftSidebar.appendChild(createToolButton(def));
}

// function LeftSideBar() {
//   return (
//     <div
//       style={{
//         width: '40px',
//         flexShrink: 0,
//         background: '#333',
//         borderRight: '1px solid #555',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         padding: '8px 4px',
//         gap: '4px',
//       }}
//     >
//       <DrawModeMenu />
//       <ToolMenu />
//     </div>
//   );
// }

// function Drawboard(props: { drawboard: HTMLDivElement }) {
//   const containerRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     if (!containerRef.current) {
//       console.error('Drawboard warn: No container ref to mount drawboard');
//       return;
//     }
//     containerRef.current.appendChild(props.drawboard);
//     return () => {
//       if (containerRef.current) {
//         containerRef.current.removeChild(props.drawboard);
//       }
//     };
//   }, []);

//   return <div ref={containerRef}></div>;
// }

// // Drawboard
// const drawboard = document.createElement('div');
// drawboard.style =
//   'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
// doc.phoxelis.canvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;

// draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;
// const refImage = document.createElement('img');
// const refImageWrapper = document.createElement('div');
// refImageWrapper.append(refImage);
// refImageWrapper.style = `position: absolute; top: 0px; right: 0px; z-index: -999; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`;

// const layersWrapper = document.createElement('div');
// layersWrapper.appendChild(doc.phoxelis.canvas);
// layersWrapper.appendChild(refImageWrapper);
// layersWrapper.appendChild(draftScreen.canvas);
// drawboard.appendChild(layersWrapper);

// Navbar
const saveButton = document.createElement('button');
saveButton.innerHTML = 'Save';
saveButton.onclick = async () => {
  await workspace.saveDocument(filename);
};
navBar.appendChild(saveButton);

const fullscreenButton = document.createElement('button');
fullscreenButton.innerHTML = 'Fullscreen';
fullscreenButton.onclick = () => toggleFullScreen(document.body);
navBar.appendChild(fullscreenButton);

const exportButton = document.createElement('button');
exportButton.innerHTML = 'Export';
exportButton.onclick = () =>
  downloadAsFile(
    JSON.stringify(ws.phoxelis.exportPhoxelis(filename)),
    `${filename}.phoxelis`,
  );
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
        const ok = saveRefImageToStorage(base64);
        if (!ok) {
          console.warn('Reference image too large for localStorage');
        }

        workspace.setReferenceImage(base64);
      } catch (err) {
        console.error('Failed to load reference image:', err);
      }
    }
  }
});
navBar.appendChild(referenceImageButton);
const moveRefImageToggle = document.createElement('input');
moveRefImageToggle.type = 'checkbox';
navBar.appendChild(moveRefImageToggle);

const modifyPalettePhoxButton = document.createElement('button');
modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
modifyPalettePhoxButton.onclick = () => {
  if (!session.paletteData.modifyingPhox) {
    session.paletteData.modifyingPhox = true;
    modifyPalettePhoxButton.innerHTML = 'UPDATING PALETTE PHOX';
  } else {
    session.paletteData.modifyingPhox = false;
    modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
  }
};
navBar.appendChild(modifyPalettePhoxButton);

const undoButton = document.createElement('button');
undoButton.innerHTML = 'Undo';
undoButton.onclick = () => workspace.undoLastChange();
navBar.appendChild(undoButton);

const redoButton = document.createElement('button');
redoButton.innerHTML = 'Redo';
redoButton.onclick = () => workspace.redoLastChange();
navBar.appendChild(redoButton);

// Sidebar

// ─── Layer Management Panel ──────────────────────────────────────────────────
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

function selectLayer(layerId: string) {
  const layerRow = layerList.querySelector(`#layer-${layerId}`);
  if (!layerRow) {
    console.error(`selectLayer error: Could not find layer by id ${layerId}`);
    return;
  }
  layerList
    .querySelectorAll('.layer-row')
    .forEach((el) => ((el as HTMLDivElement).style.background = '#2a2a2a'));
  (layerRow as HTMLDivElement).style.background = '#7a7a7a';
}

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
  const layerId = workspace.createLayer();
  createLayerElement(ws.layers[layerId]);
  renderLayerList();
  workspace.selectLayer(layerId);
  selectLayer(layerId);
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
  const layerId = session.activeLayer;
  workspace.removeLayer(session.activeLayer);
  layerList.removeChild(layerList.querySelector(`#layer-${layerId}`)!);
  renderLayerList();
});
layerActions.appendChild(removeLayerBtn);

layerPanel.appendChild(layerActions);

function createLayerElement(layer: DocumentLayer) {
  const layerRow = document.createElement('div');
  layerRow.id = `layer-${layer.layerId}`;
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
    workspace.selectLayer(layer.layerId);
  });

  // Drag handle (grip icon)
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

  // Preview container
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
  previewContainer.appendChild(layer.target);
  layerRow.appendChild(previewContainer);

  // Name input
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

  // Opacity slider
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

  // Eye button
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

  // ── Unified pointer-event drag-and-drop ──
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

  // Shared reorder logic
  function reorderRows(source: HTMLElement, target: HTMLElement, insertAbove: boolean) {
    const rows = (Array.from(layerList.children) as HTMLElement[]).toReversed();
    const dragIdx = rows.indexOf(source);
    const targetIdx = rows.indexOf(target);
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;

    const adjustedTarget = dragIdx < targetIdx ? targetIdx - 1 : targetIdx;
    const insertIdx = insertAbove ? adjustedTarget : adjustedTarget + 1;

    ws.phoxelis.moveLayer(ws.phoxelis.layers[dragIdx].id, insertIdx);

    renderLayerList();
  }

  // Show drop indicator on a target row
  function showIndicator(row: HTMLElement, clientY: number) {
    // Hide any existing indicator
    if (pointerTargetRow && pointerTargetRow !== row) {
      const prev = pointerTargetRow.querySelector('[data-drop-indicator]') as HTMLElement;
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

  // Update ghost position
  function updateGhost(clientX: number, clientY: number) {
    if (!ghost) return;
    const rowRect = pointerDownRow!.getBoundingClientRect();
    ghost.style.transform = `translate(${clientX - rowRect.left - 8}px, ${clientY - rowRect.top - 14}px)`;
  }

  // Find target row under pointer
  function findTarget(clientX: number, clientY: number): HTMLElement | null {
    if (!ghost) return null;
    ghost.style.display = 'none';
    const el = document.elementFromPoint(clientX, clientY);
    ghost.style.display = '';
    return el?.closest('.layer-row') ?? null;
  }

  // Cleanup all drag state
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

  // Pointer down — start tracking
  dragHandle.addEventListener('pointerdown', (e: PointerEvent) => {
    // Only respond to left-click (mouse) or any touch/pen
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerDownRow = layerRow;

    // Set pointer capture so we keep receiving events even if pointer leaves the element
    dragHandle.setPointerCapture(e.pointerId);
  });

  // Pointer move — handle both the "threshold check" and active dragging
  dragHandle.addEventListener('pointermove', (e: PointerEvent) => {
    if (!pointerDownRow) return;

    // If we haven't started dragging yet, check the threshold
    if (!isDragging) {
      const dx = Math.abs(e.clientX - pointerStartX);
      const dy = Math.abs(e.clientY - pointerStartY);
      // Start dragging only after moving past the threshold
      if (dx < 5 && dy < 5) return; // Still within threshold, do nothing

      isDragging = true;

      // Create ghost clone
      ghost = pointerDownRow.cloneNode(true) as HTMLElement;
      ghost.style.position = 'fixed';
      ghost.style.width = `${pointerDownRow.offsetWidth}px`;
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.85';
      ghost.style.pointerEvents = 'none';
      ghost.style.transition = 'none';
      ghost.style.transform = `translate(${e.clientX - pointerDownRow.getBoundingClientRect().left - 8}px, ${e.clientY - pointerDownRow.getBoundingClientRect().top - 14}px)`;
      document.body.appendChild(ghost);

      // Hide original row
      pointerDownRow.style.opacity = '0.3';
      pointerDownRow.style.zIndex = '100';
    }

    // Active dragging — update ghost and find target
    if (isDragging) {
      e.preventDefault();
      updateGhost(e.clientX, e.clientY);

      const target = findTarget(e.clientX, e.clientY);
      if (target && target !== pointerDownRow && target !== pointerTargetRow) {
        showIndicator(target, e.clientY);
      } else if (target === pointerDownRow && pointerTargetRow) {
        // Pointer is back on the source row, clear indicator
        const indicator = pointerTargetRow.querySelector(
          '[data-drop-indicator]',
        ) as HTMLElement;
        if (indicator) indicator.style.opacity = '0';
        pointerTargetRow = null;
      }
    }
  });

  // Pointer up — finalize the drag
  dragHandle.addEventListener('pointerup', (e: PointerEvent) => {
    if (!pointerDownRow) return;

    if (isDragging) {
      // Perform reorder
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

  // Pointer cancel (e.g. system interrupt) — cleanup
  dragHandle.addEventListener('pointercancel', () => {
    cleanupDrag();
    try {
      dragHandle.releasePointerCapture(0);
    } catch {}
  });

  layerList.appendChild(layerRow);
  return layerRow;
}

layerPanel.appendChild(layerList);

sidebar.append(workspace.alphabet);
sidebar.append(workspace.colorPicker);
sidebar.append(layerPanel);
content.append(drawModeSidebar);
content.append(leftSidebar);
content.append(workspace.drawboard);
content.append(sidebar);
appContainer.appendChild(navBar);
appContainer.appendChild(content);
appContainer.append(footer);
document.body.appendChild(appContainer);

workspace.startPanzoom();

// ─── Restore reference image & panzoom config on load ────────────────────────
// TODO store panzoom config as part of document
// const savedRefImagePanzoom = loadRefImagePanzoomConfig();
// const savedRefImageBase64 = loadRefImageFromStorage();

// if (savedRefImageBase64) {
//   // Restore the reference image
//   workspace.refImage.src = savedRefImageBase64;
//   workspace.refImage.style.display = 'block';

//   // Restore panzoom config if available
//   if (savedRefImagePanzoom) {
//     workspace.refImageScale = savedRefImagePanzoom.scale;
//     workspace.refImagePanzoom.pan(savedRefImagePanzoom.x, savedRefImagePanzoom.y);
//     workspace.refImagePanzoom.zoom(savedRefImagePanzoom.scale);
//   }
// } else if (savedRefImagePanzoom) {
//   // Panzoom config exists but no image — clear stale config
//   clearRefImageStorage();
// }

// ReactDOM.createRoot(document.querySelector('#app')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// );
