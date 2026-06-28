import { getFont, Phoxelis, type Phox, type Font, type PhoxelisObj } from 'phoxelis';
import '../style.css';
import _ from 'lodash';
import { Drawboard } from './elements/Drawboard';
import { createAlphabetSelector } from './elements/alphabet';
import { createColorPicker } from './elements/colorPicker';
import { createPaletteSelector } from './elements/palette';
import { createChangesStack } from './modules/ChangesStack';
import { createHotkeyManager } from './modules/HotkeyManager';
import { Toolbox, type ToolName } from './modules/Toolbox';
import { DrawManager, type DrawModeName } from './modules/DrawManager';
import { observable, type Observable } from '@legendapp/state';
import { LayerManager } from './modules/LayerManager';

export type Phoxel = {
  phox: Phox;
  r: number;
  c: number;
};
export type PhoxelPosition = [r: number, c: number];

export type WorkspaceLayer = {
  name: string;
  opacity: number;
  visible: boolean;
  position: number;
};

interface DocumentData {
  layers: Record<string, WorkspaceLayer>;
}

interface State {
  dp: Phox;
  drawMode: DrawModeName;
  tool: ToolName;
  activeLayer: string;
  paletteData: {
    selectedPhox: number;
    modifyingPhox: boolean;
  };
  selectedColorType: 'fg' | 'bg';
  movingRefImage: boolean;
}

export interface WorkspaceData {
  phoxelis: ReturnType<PhoxelisObj['exportPhoxelis']>;
  layers: DocumentData['layers'];
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
  data$: Observable<DocumentData> = observable({
    layers: {},
  } as DocumentData); // TODO fix?
  state$: Observable<State> = observable({
    dp: { char: 'D', fg: '#00FF00', bg: '#FF00FF' },
    drawMode: 'draw',
    tool: 'draw',
    activeLayer: '',
    paletteData: {
      selectedPhox: -1,
      modifyingPhox: false,
    },
    selectedColorType: 'fg',
    movingRefImage: false,
  });
  drawboard: Drawboard;
  colorPicker: ReturnType<typeof createColorPicker>;
  alphabet: ReturnType<typeof createAlphabetSelector>;
  palette: ReturnType<typeof createPaletteSelector>;
  layerManager: LayerManager;
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

  protected constructor(config: WorkspaceInputConfig, font: Font) {
    this.config = config;
    const { size } = this.config;

    this.font = font;
    this.phoxelis = Phoxelis(size.rows, size.cols, font, {
      renderPalette: true,
      createBaseLayer: false,
      paletteDirection: 'left',
    });
    this.draftScreen = Phoxelis(size.rows, size.cols, font);
    this.layerManager = new LayerManager(this);
    this.layerManager.createLayer();

    // Elements
    this.drawboard = new Drawboard(this);
    this.loadData();

    this.colorPicker = createColorPicker(this);
    this.alphabet = createAlphabetSelector(this);
    this.palette = createPaletteSelector(this);

    // Modules
    this.drawManager = new DrawManager(this);
    this.changesStack = createChangesStack(this);
    this.toolbox = new Toolbox(this);
    this.hotkeyManager = createHotkeyManager(this);

    this.hotkeyManager.hotkeys.push(
      { ctrl: true, key: 'z', onHotkeyEnd: () => this.changesStack.undoLastChange() },
      { ctrl: true, key: 'y', onHotkeyEnd: () => this.changesStack.redoLastChange() },
      {
        ctrl: true,
        mouse: 0,
        onHotkeyStart: (e) => {
          this.toolbox.setTool(this.toolbox.tools.panzoom);
          this.toolbox.currentTool?.handlers.onPointerDown(e as PointerEvent);
        },
      },
      {
        shift: true,
        mouse: 0,
        onHotkeyStart: (e) => {
          this.toolbox.setTool(this.toolbox.tools.panzoom);
          this.toolbox.currentTool?.handlers.onPointerDown(e as PointerEvent);
        },
      },
    );

    this.startRenderLoop();

    return this;
  }

  loadData() {
    if (this.config.data) {
      const { data } = this.config;
      this.phoxelis.importPhoxelis(data.phoxelis);

      const newLayers = _.mapValues(data.layers, (l, k) => {
        const target = this.layerManager.createLayerTarget();
        this.layersTargets[k] = target;

        return {
          ...l,
        };
      });
      this.data$.layers.set(newLayers);
      this.layerManager.selectLayer(this.phoxelis.layers[0].id);
      this.drawboard.setReferenceImage(data.refImage.src);
    }
  }

  startRenderLoop() {
    let continueRenderLoop = true;
    const renderLoop = () => {
      this.phoxelis.renderFrame(
        this.phoxelis.layers.map((l) => ({
          additionalTarget: this.layersTargets[l.id],
          opacity: this.data$.layers.get()[l.id].visible
            ? this.data$.layers.get()[l.id].opacity / 100
            : 0,
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
      data$,
      drawboard,
      config: { size, fontName },
    } = this;
    const { refImagePanzoom, refImage } = drawboard;

    const phoxelisData = phoxelis.exportPhoxelis();

    const documentData = {
      size,
      fontName,
      data: {
        layers: data$.layers.get(),
        phoxelis: phoxelisData,
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


  public onMounted() {
    this.drawboard.startPanzoom();
  }

  public dispose() {
    this.continueRenderLoop = false;
    window.cancelAnimationFrame(this.lastAnimationFrame);
    this.hotkeyManager.dispose();
    this.colorPicker.dispose();
    this.drawboard.dispose();
  }
}
