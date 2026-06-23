import { getFont, Phoxelis, type Phox, type Font, type PhoxelisObj } from 'phoxelis';
import '../style.css';
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import _ from 'lodash';
import { createRefImage } from './elements/refImage';
import { createDrawboard } from './elements/drawboard';
import { createAlphabetSelector } from './elements/alphabet';
import { createColorPicker } from './elements/colorPicker';
import { createPaletteSelector } from './elements/palette';
import { createChangesStack } from './ChangesStack';
import { createHotkeyManager } from './HotkeyManager';
import { Toolbox } from './Tools/Toolbox';

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

export const panzoomConfiguration = {
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
  drawboard: ReturnType<typeof createDrawboard>;
  refImage: { img: HTMLImageElement; wrapper: HTMLDivElement };
  scale = panzoomConfiguration.startScale;
  refImageScale = panzoomConfiguration.startScale;
  panzoom: PanzoomObject | null = null;
  refImagePanzoom: PanzoomObject | null = null;
  colorPicker: ReturnType<typeof createColorPicker>;
  alphabet: ReturnType<typeof createAlphabetSelector>;
  palette: ReturnType<typeof createPaletteSelector>;
  changesStack: ReturnType<typeof createChangesStack>;
  toolbox: Toolbox;
  mousePos: { x: number; y: number } = { x: -1, y: -1 };
  hotkeyManager: ReturnType<typeof createHotkeyManager>;
  lastAnimationFrame: number = -1;
  continueRenderLoop: boolean = true;

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
    this.drawboard = createDrawboard(this);
    this.colorPicker = createColorPicker(this);
    this.alphabet = createAlphabetSelector(this);
    this.palette = createPaletteSelector(this);

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

    this.changesStack = createChangesStack(this);
    this.toolbox = new Toolbox(this);
    this.hotkeyManager = createHotkeyManager(this);

    this.startRenderLoop();

    return this;
  }
  dispose() {
    // TODO There is some memory leak when creating many new documents. what else can we dispose of?
    window.removeEventListener('keydown', this.hotkeyManager.handleHotkeyKeydown);
    window.removeEventListener('keyup', this.hotkeyManager.handleHotkeyKeyup);

    this.continueRenderLoop = false;
    window.cancelAnimationFrame(this.lastAnimationFrame);

    this.panzoom?.destroy();
    this.refImagePanzoom?.destroy();
    this.colorPicker.dispose();
    this.drawboard.dispose();
  }

  startRenderLoop() {
    let continueRenderLoop = true;
    const renderLoop = () => {
      this.phoxelis.renderFrame(
        this.phoxelis.layers.map((l) => ({
          additionalTarget: this.layersTargets[l.id],
          opacity: this.ds.layers[l.id].visible ? this.ds.layers[l.id].opacity / 100 : 0,
        })),
      );
      this.draftScreen.renderFrame();
      if (continueRenderLoop) {
        this.lastAnimationFrame = window.requestAnimationFrame(renderLoop);
      }
    };
    this.lastAnimationFrame = window.requestAnimationFrame(renderLoop);
  }

  exportPhoxelis() {
    return this.phoxelis.exportPhoxelis();
  }

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
      drawboard.element.firstElementChild as HTMLElement,
      panzoomConfiguration,
    );
    this.refImagePanzoom = Panzoom(refImage.img, { ...panzoomConfiguration });

    if (data) {
      this.refImagePanzoom.pan(data.refImage.config.panX, data.refImage.config.panY);
      this.refImagePanzoom.zoom(data.refImage.config.scale);
    }
  }

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
}
