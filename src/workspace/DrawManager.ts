import type { PhoxelisObj } from 'phoxelis';
import type { Workspace } from './Workspace';

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

export class DrawManager {
  ws: Workspace;

  constructor(ws: Workspace) {
    this.ws = ws;
  }

  draw(
    target: PhoxelisObj,
    r: number,
    c: number,
    layerId: string,
    options: { draftErasure: boolean } = { draftErasure: false },
  ) {
    const { state: session, phoxelis } = this.ws;
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
