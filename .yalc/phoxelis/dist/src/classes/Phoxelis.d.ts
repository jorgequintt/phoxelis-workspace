import { Font } from '../utils/fontLoader';
export type Phox = {
    char: string;
    fg: string;
    bg: string;
};
export type LayerOptions = {
    additionalTarget?: HTMLCanvasElement;
    opacity?: number;
};
export type Layer = {
    id: string;
    buffer: Uint8Array<ArrayBuffer>;
};
export type PhoxelisObj = ReturnType<typeof Phoxelis>;
export type LayerData = ReturnType<PhoxelisObj['removeLayer']>;
export declare function Phoxelis(rows: number, cols: number, font: Font, options?: {
    createBaseLayer?: boolean;
    renderPalette?: boolean;
    paletteDirection?: 'right' | 'left';
}): {
    renderFrame: (layerOptions?: Array<LayerOptions | null>) => void;
    renderPhoxel: (char: string, fg: string, bg: string, r: number, c: number, layerId?: string) => void;
    removePhoxel: (r: number, c: number, layerId?: string) => void;
    canvas: HTMLCanvasElement;
    reset: (keepBaseLayer?: boolean) => void;
    clearScreen: () => void;
    palette: HTMLCanvasElement;
    exportPhoxelis: () => {
        size: {
            rows: number;
            cols: number;
        };
        palette: (string | null)[];
        layers: {
            buffer: string;
            id: string;
        }[];
    };
    importPhoxelis: (data: ReturnType<() => {
        size: {
            rows: number;
            cols: number;
        };
        palette: (string | null)[];
        layers: {
            buffer: string;
            id: string;
        }[];
    }>) => void;
    getPhoxFromPaletteIndex: (index: number) => Phox | null;
    getPhoxFromPosition: (r: number, c: number, layerId: string) => Phox | null;
    storePhoxInPalette: (index: number, phox: Phox) => void;
    cleanUnusedPhoxesFromPalette: () => void;
    layers: Layer[];
    addLayer: (layerId?: string) => string;
    getLayer: (layerId: string) => Layer;
    moveLayer: (layerId: string, newIndex: number) => void;
    removeLayer: (layerId: string) => {
        layer: Layer;
        phoxes: Record<string, string>;
    };
    loadLayer: (layerData: LayerData) => void;
    layerPositions: Record<string, number>;
};
