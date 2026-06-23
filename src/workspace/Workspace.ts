import { getFont, Phoxelis, type Phox, type Font, type PhoxelisObj } from 'phoxelis';
import '../style.css';
import _ from 'lodash';
import { Drawboard } from './elements/drawboard';
import { createAlphabetSelector } from './elements/alphabet';
import { createColorPicker } from './elements/colorPicker';
import { createPaletteSelector } from './elements/palette';
import { createChangesStack } from './ChangesStack';
import { createHotkeyManager } from './HotkeyManager';
import { Toolbox } from './Toolbox';
import { DrawManager } from './DrawManager';

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

export interface WorkspaceData {
  phoxelis: ReturnType<PhoxelisObj['exportPhoxelis']>;
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
  drawboard: Drawboard;
  colorPicker: ReturnType<typeof createColorPicker>;
  alphabet: ReturnType<typeof createAlphabetSelector>;
  palette: ReturnType<typeof createPaletteSelector>;
  changesStack: ReturnType<typeof createChangesStack>;
  toolbox: Toolbox;
  drawManager: DrawManager;
  hotkeyManager: ReturnType<typeof createHotkeyManager>;
  lastAnimationFrame: number = -1;
  continueRenderLoop: boolean = true;

  static async create(config: WorkspaceInputConfig) {
    const font = await getFont(config.fontName);
    return new Workspace(config, font);
  }

  private constructor(config: WorkspaceInputConfig, font: Font) {
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
    this.drawboard = new Drawboard(this);
    this.colorPicker = createColorPicker(this);
    this.alphabet = createAlphabetSelector(this);
    this.palette = createPaletteSelector(this);
    this.drawManager = new DrawManager(this);
    this.changesStack = createChangesStack(this);
    this.toolbox = new Toolbox(this);
    this.hotkeyManager = createHotkeyManager(this);

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
      this.drawboard.setReferenceImage(data.refImage.src);
    }


    this.startRenderLoop();

    return this;
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
      drawboard,
      config: { size, fontName },
    } = this;
    const { refImagePanzoom, refImage } = drawboard;

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

  
  dispose() {
    this.continueRenderLoop = false;
    window.cancelAnimationFrame(this.lastAnimationFrame);
    this.hotkeyManager.dispose();
    this.colorPicker.dispose();
    this.drawboard.dispose();
  }
}
