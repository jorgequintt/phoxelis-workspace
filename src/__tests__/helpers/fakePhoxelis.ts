import type { Phox, PhoxelisObj } from 'phoxelis';

/**
 * In-memory fake of the Phoxelis engine (`PhoxelisObj`). Mirrors the real
 * semantics from `.yalc/phoxelis/dist/phoxelis.js`:
 *
 * - `palette` is `(string | null)[]` with index 0 = null (empty); entries are
 *   `"char;fg;bg"` and **fg/bg are lowercased** on store (matching the engine).
 * - each layer `buffer` is a `Uint8Array(rows*cols)` holding 1-based palette
 *   indices (0 = empty).
 * - `removeLayer` returns `{ layer, phoxes }` where `phoxes` maps palette
 *   index → `"char;fg;bg"`; `loadLayer` re-renders cells from those strings.
 * - `layerPositions` maps layer id → index in the `layers` array.
 *
 * The DOM/WebGL surface (`canvas`, `palette`, `renderFrame`) is stubbed.
 */
export type FakePhoxelisOptions = {
  createBaseLayer?: boolean;
};

function parsePaletteEntry(entry: string): Phox | null {
  const parts =
    entry.charAt(0) === ';' ? [';', ...entry.slice(2).split(';')] : entry.split(';');
  if (parts.length < 3) return null;
  return { char: parts[0], fg: parts[1], bg: parts[2] };
}

function encodeBuffer(buffer: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < buffer.length; i++) bin += String.fromCharCode(buffer[i]);
  return btoa(bin);
}

function decodeBuffer(data: string): Uint8Array {
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}

export function createFakePhoxelis(
  rows: number,
  cols: number,
  options: FakePhoxelisOptions = {},
): PhoxelisObj {
  const { createBaseLayer = true } = options;

  const layers: PhoxelisObj['layers'] = [];
  const layerPositions: Record<string, number> = {};
  let palette: (string | null)[] = [null];
  let idCounter = 0;

  const recomputePositions = () => {
    Object.keys(layerPositions).forEach((key) => delete layerPositions[key]);
    layers.forEach((layer, index) => {
      layerPositions[layer.id] = index;
    });
  };

  const addLayer = (layerId?: string): string => {
    if (layerId && layerId in layerPositions) return layerId;
    const id = layerId ?? `layer-${++idCounter}`;
    layers.push({ id, buffer: new Uint8Array(rows * cols) });
    layerPositions[id] = layers.length - 1;
    return id;
  };

  const getLayer = (layerId: string) => layers[layerPositions[layerId]];

  const resolveLayerId = (layerId?: string): string | null => {
    if (layerId) return layerId;
    if (layers[0]) return layers[0].id;
    return null;
  };

  const renderPhoxel = (
    char: string,
    fg: string,
    bg: string,
    r: number,
    c: number,
    layerId?: string,
  ) => {
    const target = resolveLayerId(layerId);
    if (target === null) {
      console.error('renderPhoxel error: no layers in phoxelis.');
      return;
    }
    const layer = getLayer(target);
    if (!layer) {
      console.error(`renderPhoxel error: Layer ${target} not found.`);
      return;
    }
    const key = `${char};${fg.toLowerCase()};${bg.toLowerCase()}`;
    let index = palette.indexOf(key);
    if (index === -1) {
      index = palette.indexOf(null, 1);
      if (index === -1) index = palette.length;
      palette[index] = key;
    }
    layer.buffer[r * cols + c] = index;
  };

  const removePhoxel = (r: number, c: number, layerId?: string) => {
    const target = resolveLayerId(layerId);
    if (target === null) {
      console.error('removePhoxel error: no layers in phoxelis.');
      return;
    }
    const layer = getLayer(target);
    if (!layer) {
      console.error(`removePhoxel error: Layer ${target} not found.`);
      return;
    }
    layer.buffer[r * cols + c] = 0;
  };

  const getPhoxFromPaletteIndex = (index: number): Phox | null => {
    if (index === 0) return null;
    const entry = palette[index];
    if (!entry) return null;
    return parsePaletteEntry(entry);
  };

  const getPhoxFromPosition = (r: number, c: number, layerId: string): Phox | null => {
    const layer = getLayer(layerId);
    if (!layer) {
      console.warn(`getPhoxFromPosition error: Could not find layer by id ${layerId}`);
      return null;
    }
    return getPhoxFromPaletteIndex(layer.buffer[r * cols + c]);
  };

  const removeLayer = (layerId: string) => {
    const layer = getLayer(layerId);
    const phoxes: Record<string, string> = {};
    if (layer) {
      layer.buffer.forEach((index) => {
        if (index > 0 && palette[index] && !phoxes[index]) phoxes[index] = palette[index]!;
      });
      layers.splice(layerPositions[layerId], 1);
    }
    recomputePositions();
    return { layer: { id: layerId, buffer: layer?.buffer ?? new Uint8Array(0) }, phoxes };
  };

  const loadLayer = (layerData: ReturnType<PhoxelisObj['removeLayer']>) => {
    if (!layerData) {
      console.error('loadLayer error: No layer to load');
      return;
    }
    const { layer, phoxes } = layerData;
    const newId = addLayer(layer.id);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = layer.buffer[r * cols + c];
        if (index === 0) continue;
        const entry = phoxes[index];
        if (!entry) continue;
        const phox = parsePaletteEntry(entry);
        if (phox) renderPhoxel(phox.char, phox.fg, phox.bg, r, c, newId);
      }
    }
  };

  const moveLayer = (layerId: string, newIndex: number) => {
    const currentIndex = layerPositions[layerId];
    if (currentIndex === undefined) {
      console.error(`moveLayer error: Could not find layer by id ${layerId}`);
      return;
    }
    if (layers.length < newIndex + 1) {
      console.error(`moveLayer error: Cannot move to index ${newIndex}. Layers.length too short.`);
      return;
    }
    const layer = layers.splice(currentIndex, 1)[0];
    layers.splice(newIndex, 0, layer);
    recomputePositions();
  };

  const reset = (keepBaseLayer = false) => {
    const baseId = layers[0]?.id;
    layers.length = 0;
    Object.keys(layerPositions).forEach((key) => delete layerPositions[key]);
    palette = [null];
    if (keepBaseLayer && baseId) addLayer(baseId);
  };

  const exportPhoxelis = () => ({
    size: { rows, cols },
    palette: [...palette],
    layers: layers.map((layer) => ({ ...layer, buffer: encodeBuffer(layer.buffer) })),
  });

  const importPhoxelis = (data: ReturnType<PhoxelisObj['exportPhoxelis']>) => {
    if (data.size.cols !== cols || data.size.rows !== rows) {
      console.warn('Imported Phoxelis and target Phoxelis have mismatching sizes.');
    }
    reset(false);
    data.layers.forEach((layerData) => {
      const newId = addLayer(layerData.id);
      const buffer = decodeBuffer(layerData.buffer);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = buffer[r * cols + c];
          if (index === 0) continue;
          const entry = data.palette[index];
          if (!entry) continue;
          const phox = parsePaletteEntry(entry);
          if (phox) renderPhoxel(phox.char, phox.fg, phox.bg, r, c, newId);
        }
      }
    });
  };

  const storePhoxInPalette = (index: number, phox: Phox) => {
    palette[index] = `${phox.char};${phox.fg.toLowerCase()};${phox.bg.toLowerCase()}`;
  };

  const cleanUnusedPhoxesFromPalette = () => {
    const used = new Set<number>([0]);
    layers.forEach((layer) =>
      layer.buffer.forEach((value) => {
        used.add(value);
      }),
    );
    palette = palette.map((entry, index) => (used.has(index) ? entry : null));
  };

  if (createBaseLayer) addLayer();

  return {
    renderFrame: () => {},
    renderPhoxel,
    removePhoxel,
    canvas: document.createElement('canvas'),
    reset,
    clearScreen: () => layers.forEach((layer) => layer.buffer.fill(0)),
    palette: document.createElement('canvas'),
    exportPhoxelis,
    importPhoxelis,
    getPhoxFromPaletteIndex,
    getPhoxFromPosition,
    storePhoxInPalette,
    cleanUnusedPhoxesFromPalette,
    layers,
    addLayer,
    getLayer,
    moveLayer,
    removeLayer,
    loadLayer,
    layerPositions,
  } as PhoxelisObj;
}