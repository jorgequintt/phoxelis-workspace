import { getFont, Phoxelis, type Phox, type Font, type PhoxelisObj } from 'phoxelis';
import '../style.css';
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import _ from 'lodash';
import { createRefImage } from './elements/refImage';
import { createDrawboard } from './elements/drawboard';
import { createAlphabetSelector } from './elements/alphabet';
import { createColorPicker } from './elements/colorPicker';
import { createPaletteSelector } from './elements/palette';
import { createChangesStack } from './ChangesStack';
import { createTools } from './Tools';
import { createHotkeyManager } from './HotkeyManager';

export type Phoxel = {
  phox: Phox;
  r: number;
  c: number;
};
export type PhoxelPosition = [r: number, c: number];

export type DocumentLayer = {
  name: string;
  opacity: number;
  visible: boolean;
};

interface DocumentState {
  layers: Record<string, DocumentLayer>;
}

interface SessionState {
  dp: Phox;
  drawMode: 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase';
  activeLayer: string;
  paletteData: {
    selectedPhox: number;
    modifyingPhox: boolean;
  };
  alphabetData: {
    selectedChar: number;
  };
  selectedColorType: 'fg' | 'bg';
  movingRefImage: boolean;
}

export type DrawModeDefinition = {
  name: 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase';
  icon: string;
  tooltip: string;
};

export const drawModeDefs: DrawModeDefinition[] = [
  { name: 'draw', icon: '✏', tooltip: 'Draw (char + fg + bg)' },
  { name: 'char', icon: 'A', tooltip: 'Char only' },
  { name: 'fg', icon: 'F', tooltip: 'Foreground color only' },
  { name: 'bg', icon: 'B', tooltip: 'Background color only' },
  { name: 'color', icon: '◉', tooltip: 'Color (fg + bg) only' },
  { name: 'erase', icon: '✕', tooltip: 'Erase' },
];

export interface Tool {
  name: string;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onPinchStart?: (e: HammerInput) => void;
  onPinchMove?: (e: HammerInput) => void;
  onPinchEnd?: (e: HammerInput) => void;
  submit?: () => void;
  abort?: () => void;
  resetTool?: () => void;
  data?: Record<string, any>;
}

export type CurrentTool = {
  tool: Tool;
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPinchStart: (e: HammerInput) => void;
    onPinchMove: (e: HammerInput) => void;
    onPinchEnd: (e: HammerInput) => void;
  };
};

export type ToolDefinition = {
  name: string;
  icon: string;
  tooltip: string;
};

export const toolDefs: ToolDefinition[] = [
  {
    name: 'draw',
    icon: '✏',
    tooltip: 'Draw (freehand)',
  },
  {
    name: 'rect',
    icon: '□',
    tooltip: 'Rectangle (outline)',
  },
  {
    name: 'filledRect',
    icon: '■',
    tooltip: 'Filled Rectangle',
  },
  {
    name: 'line',
    icon: '╱',
    tooltip: 'Line',
  },
  {
    name: 'ellipse',
    icon: '⬭',
    tooltip: 'Ellipse (outline)',
  },
  {
    name: 'filledEllipse',
    icon: '●',
    tooltip: 'Filled Ellipse',
  },
];

const panzoomConfiguration = {
  minScale: 0.15,
  maxScale: 10,
  noBind: true,
  relative: true,
  cursor: 'default',
  startX: 0,
  startY: 0,
  startScale: 1,
};

export interface WorkspaceData {
  phoxelis: ReturnType<ReturnType<typeof Phoxelis>['exportPhoxelis']>; // TODO export type in phoxelis for this
  layers: DocumentState['layers'];
  refImage: {
    src: string;
    config: {
      panX: number;
      panY: number;
      scale: number;
    };
  };
}

export interface WorkspaceInputConfig {
  size: {
    rows: number;
    cols: number;
  };
  fontName: Parameters<typeof getFont>[0];
  data?: WorkspaceData;
}

export interface WorkspaceExportConfig extends WorkspaceInputConfig {
  data: WorkspaceData;
}

export class Workspace {
  config: WorkspaceInputConfig;
  font: Font;
  phoxelis: PhoxelisObj;
  draftScreen: PhoxelisObj;
  layersTargets: Record<string, HTMLCanvasElement> = {};
  ds: DocumentState;
  session: SessionState;
  refImage: { img: HTMLImageElement; wrapper: HTMLDivElement };
  drawboard: HTMLDivElement;
  colorPicker: ReturnType<typeof createColorPicker>;
  alphabet: ReturnType<typeof createAlphabetSelector>;
  palette: ReturnType<typeof createPaletteSelector>;
  panzoom: PanzoomObject | null = null;
  refImagePanzoom: PanzoomObject | null = null;
  scale = panzoomConfiguration.startScale;
  refImageScale = panzoomConfiguration.startScale;
  changesStack: ReturnType<typeof createChangesStack>;
  hammer: HammerManager;
  currTool: null | CurrentTool;
  previousTool: null | Tool;
  mousePos: { x: number; y: number } = { x: -1, y: -1 };
  tools: ReturnType<typeof createTools>;
  hotkeyManager: ReturnType<typeof createHotkeyManager>;

  static async create(config: WorkspaceInputConfig) {
    const font = await getFont(config.fontName);
    return new Workspace(config, font);
  }

  private constructor(config: WorkspaceInputConfig, font: Font) {
    console.log('config', config);
    this.config = config;
    const { size } = this.config;

    // Experimental defaults to prevent asserting each time
    this.font = font;
    this.phoxelis = Phoxelis(size.rows, size.cols, font, {
      renderPalette: true,
      createBaseLayer: false,
    });
    this.draftScreen = Phoxelis(size.rows, size.cols, font);

    this.ds = {
      layers: {},
    };

    const baseLayer = this.createLayer();
    this.session = {
      dp: { char: 'D', fg: '#00FF00', bg: '#FF00FF' },
      drawMode: 'draw',
      activeLayer: baseLayer,
      paletteData: {
        selectedPhox: -1,
        modifyingPhox: false,
      },
      alphabetData: {
        selectedChar: font.charactersList.findIndex(
          (c) => c.codepoint === 'D'.codePointAt(0),
        ),
      },
      selectedColorType: 'fg',
      movingRefImage: false,
    };

    // MARK: Elements

    this.refImage = createRefImage();
    this.drawboard = createDrawboard(
      this.phoxelis.canvas,
      this.draftScreen.canvas,
      this.refImage.wrapper,
    );
    this.colorPicker = this.createColorPicker();
    this.selectColorType('fg');
    this.alphabet = this.createAlphabetSelector();
    this.palette = this.createPaletteSelector();

    this.hammer = new Hammer(this.drawboard);

    // MARK: Load data variable if present. Create defaults if not
    if (this.config.data) {
      const { data } = this.config;
      this.phoxelis.importPhoxelis(data.phoxelis);

      this.ds.layers = _.mapValues(data.layers, (l, k) => {
        const target = this.createLayerTarget();
        this.layersTargets[k] = target;

        return {
          ...l,
        };
      });
      this.selectLayer(this.phoxelis.layers[0].id);
      this.setReferenceImage(data.refImage.src);
    }

    // TODO: This should be a class (new ChangesStack(this));
    this.changesStack = this.createChangesStack();

    this.tools = createTools(this);
    this.currTool = null;
    this.previousTool = null;
    this.mousePos = { x: -1, y: -1 };
    this.setTool(this.tools.draw);

    this.hammer.get('pinch').set({ enable: true });
    this.hammer.on('pinchstart', (e) => {
      this.setTool(this.tools.panzoom);
      this.currTool?.handlers.onPinchStart(e);
    });

    this.drawboard.addEventListener('pointerdown', this.setMousePos);
    this.drawboard.addEventListener('pointermove', this.setMousePos);
    this.drawboard.addEventListener('pointerup', this.setMousePos);
    const handleWindowMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        this.currTool?.tool.abort?.();
      }
    };
    window.addEventListener('mouseout', handleWindowMouseOut);

    // MARK: Rendering
    let continueRenderLoop = true;
    let lastAnimationFrame: number = -1;
    const renderLoop = () => {
      this.phoxelis.renderFrame(
        this.phoxelis.layers.map((l) => ({
          additionalTarget: this.layersTargets[l.id],
          opacity: this.ds.layers[l.id].visible ? this.ds.layers[l.id].opacity / 100 : 0,
        })),
      );
      this.draftScreen.renderFrame();
      if (continueRenderLoop) {
        lastAnimationFrame = window.requestAnimationFrame(renderLoop);
      }
    };
    lastAnimationFrame = window.requestAnimationFrame(renderLoop);

    this.hotkeyManager = createHotkeyManager(this);

    this.dispose = () => {
      // TODO There is some memory leak when creating many new documents. what else can we dispose of?
      window.removeEventListener('keydown', this.hotkeyManager.handleHotkeyKeydown);
      window.removeEventListener('keyup', this.hotkeyManager.handleHotkeyKeyup);
      window.removeEventListener('mouseout', handleWindowMouseOut);

      continueRenderLoop = false;
      window.cancelAnimationFrame(lastAnimationFrame);

      this.hammer.destroy();
      this.panzoom?.destroy();
      this.refImagePanzoom?.destroy();
      this.colorPicker.picker.off(
        'color:change',
        this.colorPicker.handleColorPickeChange,
      );
      this.colorPicker.el.remove();
    };

    return this;
  } // MARK: WIP
  exportPhoxelis() {
    return this.phoxelis.exportPhoxelis();
  }

  dispose: () => void;

  exportData(): WorkspaceExportConfig {
    const {
      phoxelis,
      ds,
      refImagePanzoom,
      refImage,
      config: { size, fontName },
    } = this;
    const phoxelisData = phoxelis.exportPhoxelis();

    const documentData = {
      size,
      fontName,
      data: {
        phoxelis: phoxelisData,
        layers: ds.layers,
        refImage: {
          src: refImage.img.src ?? '',
          config: {
            panX: refImagePanzoom?.getPan().x ?? 0,
            panY: refImagePanzoom?.getPan().y ?? 0,
            scale: refImagePanzoom?.getScale() ?? 1,
          },
        },
      },
    };

    return documentData;
  }
  
  // Arrow func to prevent addEventListener to re-assigning this
  private setMousePos = (event: PointerEvent) => {
    const {
      config: { size },
      mousePos,
      font,
    } = this;
    const { width, top, left } = this.phoxelis.canvas.getBoundingClientRect();
    const scale = width / (size.cols * font.width);
    const mouseScreenPosX = event.clientX - left;
    const mouseScreenPosY = event.clientY - top;
    mousePos.x = Math.min(
      size.cols - 1,
      Math.max(0, Math.floor(mouseScreenPosX / (font.width * scale))),
    );
    mousePos.y = Math.min(
      size.rows - 1,
      Math.max(0, Math.floor(mouseScreenPosY / (font.height * scale))),
    );
  }

  createChangesStack = createChangesStack;

  setReferenceImage(base64: string) {
    this.refImage.img.src = base64;
    this.refImageScale = 1;
    this.refImagePanzoom?.reset();
  }

  getReferenceImageConfig() {
    return {
      src: this.refImage.img.src ?? '',
      config: {
        panX: this.refImagePanzoom?.getPan().x ?? 0,
        panY: this.refImagePanzoom?.getPan().y ?? 0,
        scale: this.refImagePanzoom?.getScale() ?? 1,
      },
    };
  }

  /** Can only be done once drawboard is in the DOM */
  startPanzoom() {
    const {
      refImage,
      config: { data },
      drawboard,
    } = this;
    this.panzoom = Panzoom(
      drawboard.firstElementChild as HTMLElement,
      panzoomConfiguration,
    );
    this.refImagePanzoom = Panzoom(refImage.img, { ...panzoomConfiguration });

    if (data) {
      this.refImagePanzoom.pan(data.refImage.config.panX, data.refImage.config.panY);
      this.refImagePanzoom.zoom(data.refImage.config.scale);
    }
  }
  createPaletteSelector = createPaletteSelector;
  createColorPicker = createColorPicker;
  private createAlphabetSelector = createAlphabetSelector;
  public createRefImage = createRefImage;

  // Later
  public getDraftBaseLayer() {
    return this.draftScreen.layers[0].id;
  }

  public createLayer(layerId?: string) {
    const target = this.createLayerTarget();

    const lid = layerId ?? this.phoxelis.addLayer();

    this.ds.layers[lid] = {
      name: `Layer #${this.phoxelis.layers.length}`,
      opacity: 100,
      visible: true,
    };

    this.layersTargets[lid] = target;

    return lid;
  }

  public removeLayer(layerId: string) {
    if (this.phoxelis.layers.length === 1) {
      console.warn("removeDocumentLayer error: You can't remove the base layer.");
      return;
    }

    const layerPosition = this.phoxelis.layerPositions[layerId];
    this.phoxelis.removeLayer(layerId);
    delete this.ds.layers[layerId];

    const newSelectPos = Math.max(
      0,
      Math.min(this.phoxelis.layers.length - 1, layerPosition),
    );
    const layerBeforeId = this.phoxelis.layers[newSelectPos].id;
    this.selectLayer(layerBeforeId);
  }

  public moveLayer(...args: Parameters<typeof this.phoxelis.moveLayer>) {
    return this.phoxelis.moveLayer(...args);
  }

  private selectLayer(layerId: string) {
    this.session.activeLayer = layerId;
  }

  public getSortedLayers() {
    return this.phoxelis.layers.map((l) => l.id);
  }

  private createLayerTarget() {
    const target = document.createElement('canvas');
    target.width = this.font.width * this.config.size.cols;
    target.height = this.font.height * this.config.size.rows;
    target.style = `height: 100%; width: 100%; object-fit: contain;`;
    return target;
  }

  selectColorType(type: 'fg' | 'bg') {
    this.session.selectedColorType = type;
    this.colorPicker.picker.color.hexString = this.session.dp[type];
  }

  renderDpWithMode(
    target: ReturnType<typeof Phoxelis>,
    r: number,
    c: number,
    layerId: string,
    options: { draftErasure: boolean } = { draftErasure: false },
  ) {
    const { session, phoxelis } = this;
    if (session.drawMode === 'draw') {
      target.renderPhoxel(session.dp.char, session.dp.fg, session.dp.bg, r, c, layerId);
      return;
    } else if (session.drawMode === 'char') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        session.dp.char,
        underlyingPhoxel.fg,
        underlyingPhoxel.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'color') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        underlyingPhoxel.char,
        session.dp.fg,
        session.dp.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'fg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        underlyingPhoxel.char,
        session.dp.fg,
        underlyingPhoxel.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'bg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        underlyingPhoxel.char,
        underlyingPhoxel.fg,
        session.dp.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'erase') {
      if (options.draftErasure) {
        target.renderPhoxel('D', '#FF0000', '#FF000055', r, c, layerId);
      } else {
        target.removePhoxel(r, c, layerId);
      }
    }
  }

  setTool(tool: Tool | string) {
    const { currTool, drawboard, hammer } = this;

    if (typeof tool === 'string') {
      // TODO redo this
      tool = this.tools[tool as keyof ReturnType<typeof createTools>];
      if (!tool) throw new Error(`No tool by name ${tool}`);
    }

    if (currTool) {
      currTool.tool.abort?.();
      drawboard.removeEventListener('pointerdown', currTool.handlers.onPointerDown);
      drawboard.removeEventListener('pointermove', currTool.handlers.onPointerMove);
      drawboard.removeEventListener('pointerup', currTool.handlers.onPointerUp);
      hammer.off('pinchstart', currTool.handlers.onPinchStart);
      hammer.off('pinchmove', currTool.handlers.onPinchMove);
      hammer.off('pinchend', currTool.handlers.onPinchEnd);
      this.previousTool = currTool.tool;
    }

    this.currTool = {
      tool,
      handlers: {
        onPointerDown: (e) => {
          drawboard.setPointerCapture(e.pointerId);
          tool.onPointerDown!(e);
        },
        onPointerMove: (e) => {
          tool.onPointerMove!(e);
        },
        onPointerUp: (e) => {
          try {
            drawboard.releasePointerCapture(e.pointerId);
          } catch {}
          tool.onPointerUp!(e);
        },
        onPinchStart: (e) => tool.onPinchStart!(e),
        onPinchMove: (e) => tool.onPinchMove!(e),
        onPinchEnd: (e) => tool.onPinchEnd!(e),
      },
    };

    // TODO fix currTOol type?
    drawboard.addEventListener('pointerdown', this.currTool!.handlers.onPointerDown);
    drawboard.addEventListener('pointermove', this.currTool!.handlers.onPointerMove);
    drawboard.addEventListener('pointerup', this.currTool!.handlers.onPointerUp);
    hammer.on('pinchstart', this.currTool!.handlers.onPinchStart);
    hammer.on('pinchmove', this.currTool!.handlers.onPinchMove);
    hammer.on('pinchend', this.currTool!.handlers.onPinchEnd);
  }
  setPreviousTool() {
    if (this.previousTool) this.setTool(this.previousTool);
  }
}
