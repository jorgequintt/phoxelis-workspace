import type { Phox } from 'phoxelis';
import type { Workspace } from '../Workspace';

export type DrawModeName = 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase' | 'motion';

export type DrawModeDefinition = {
  name: DrawModeName;
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
  { name: 'motion', icon: '▶', tooltip: 'Motion' },
];

export class DrawManager {
  ws: Workspace;
  private motionCursor = 0;

  constructor(ws: Workspace) {
    this.ws = ws;
  }

  startMotionStroke() {
    this.motionCursor = 0;
  }

  getMotionChar(): string | null {
    const { state$, data$ } = this.ws;
    const motionId = state$.activeMotionId.get();
    if (!motionId) return null;
    const motion = data$.motions.get()[motionId];
    if (!motion || motion.chars.length === 0) return null;

    const char = state$.motionWrap.get()
      ? motion.chars[this.motionCursor % motion.chars.length]
      : motion.chars[Math.min(this.motionCursor, motion.chars.length - 1)];
    this.motionCursor++;
    return char;
  }

  draw(drawMode: DrawModeName, dp: Phox, r: number, c: number, layerId: string) {
    const { phoxelis } = this.ws;

    if (drawMode === 'draw') {
      phoxelis.renderPhoxel(dp.char, dp.fg, dp.bg, r, c, layerId);
      return;
    } else if (drawMode === 'motion') {
      const char = this.getMotionChar() ?? dp.char;
      phoxelis.renderPhoxel(char, dp.fg, dp.bg, r, c, layerId);
      return;
    } else if (drawMode === 'char') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, layerId);
      if (!underlyingPhoxel) return;
      phoxelis.renderPhoxel(
        dp.char,
        underlyingPhoxel.fg,
        underlyingPhoxel.bg,
        r,
        c,
        layerId,
      );
    } else if (drawMode === 'color') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, layerId);
      if (!underlyingPhoxel) return;
      phoxelis.renderPhoxel(underlyingPhoxel.char, dp.fg, dp.bg, r, c, layerId);
    } else if (drawMode === 'fg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, layerId);
      if (!underlyingPhoxel) return;
      phoxelis.renderPhoxel(
        underlyingPhoxel.char,
        dp.fg,
        underlyingPhoxel.bg,
        r,
        c,
        layerId,
      );
    } else if (drawMode === 'bg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, layerId);
      if (!underlyingPhoxel) return;
      phoxelis.renderPhoxel(
        underlyingPhoxel.char,
        underlyingPhoxel.fg,
        dp.bg,
        r,
        c,
        layerId,
      );
    } else if (drawMode === 'erase') {
      phoxelis.removePhoxel(r, c, layerId);
    }
  }

  draft(r: number, c: number) {
    const { state$, phoxelis, draftScreen } = this.ws;
    const dp = state$.dp.get();
    const drawMode = state$.drawMode.get();
    const activeLayer = state$.activeLayer.get();

    if (drawMode === 'draw') {
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r, c);
      return;
    } else if (drawMode === 'motion') {
      const char = this.getMotionChar() ?? dp.char;
      draftScreen.renderPhoxel(char, dp.fg, dp.bg, r, c);
      return;
    } else if (drawMode === 'char') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, activeLayer);
      if (!underlyingPhoxel) return;
      draftScreen.renderPhoxel(dp.char, underlyingPhoxel.fg, underlyingPhoxel.bg, r, c);
    } else if (drawMode === 'color') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, activeLayer);
      if (!underlyingPhoxel) return;
      draftScreen.renderPhoxel(underlyingPhoxel.char, dp.fg, dp.bg, r, c);
    } else if (drawMode === 'fg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, activeLayer);
      if (!underlyingPhoxel) return;
      draftScreen.renderPhoxel(underlyingPhoxel.char, dp.fg, underlyingPhoxel.bg, r, c);
    } else if (drawMode === 'bg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, activeLayer);
      if (!underlyingPhoxel) return;
      draftScreen.renderPhoxel(underlyingPhoxel.char, underlyingPhoxel.fg, dp.bg, r, c);
    } else if (drawMode === 'erase') {
      draftScreen.renderPhoxel('D', '#FF0000', '#FF000055', r, c);
    }
  }
}
