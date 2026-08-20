import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  bresenhamCells,
  circleCells,
  drawEllipseFill,
  drawEllipseOutline,
  scaleCanvas,
} from '../../utils/rendering';

describe('bresenhamCells', () => {
  it('draws a horizontal line with both endpoints', () => {
    expect(bresenhamCells(0, 0, 0, 5)).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 0, c: 3 },
      { r: 0, c: 4 },
      { r: 0, c: 5 },
    ]);
  });

  it('draws a vertical line with both endpoints', () => {
    expect(bresenhamCells(0, 0, 5, 0)).toEqual([
      { r: 0, c: 0 },
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 3, c: 0 },
      { r: 4, c: 0 },
      { r: 5, c: 0 },
    ]);
  });

  it('draws a 45-degree diagonal', () => {
    expect(bresenhamCells(0, 0, 4, 4)).toEqual([
      { r: 0, c: 0 },
      { r: 1, c: 1 },
      { r: 2, c: 2 },
      { r: 3, c: 3 },
      { r: 4, c: 4 },
    ]);
  });

  it('is direction-agnostic in length and endpoints (8-connected both ways)', () => {
    const forward = bresenhamCells(0, 1, 3, 5);
    const backward = bresenhamCells(3, 5, 0, 1);
    expect(backward).toHaveLength(forward.length);
    expect(backward[0]).toEqual({ r: 3, c: 5 });
    expect(backward[backward.length - 1]).toEqual({ r: 0, c: 1 });
    for (let i = 1; i < backward.length; i++) {
      const dr = Math.abs(backward[i].r - backward[i - 1].r);
      const dc = Math.abs(backward[i].c - backward[i - 1].c);
      expect(dr).toBeLessThanOrEqual(1);
      expect(dc).toBeLessThanOrEqual(1);
      expect(dr + dc).toBeGreaterThan(0);
    }
  });

  it('covers all octants without gaps (8-connected)', () => {
    const cells = bresenhamCells(0, 0, 2, 5);
    expect(cells[0]).toEqual({ r: 0, c: 0 });
    expect(cells[cells.length - 1]).toEqual({ r: 2, c: 5 });
    for (let i = 1; i < cells.length; i++) {
      const dr = Math.abs(cells[i].r - cells[i - 1].r);
      const dc = Math.abs(cells[i].c - cells[i - 1].c);
      expect(dr).toBeLessThanOrEqual(1);
      expect(dc).toBeLessThanOrEqual(1);
      expect(dr + dc).toBeGreaterThan(0);
    }
  });

  it('returns a single cell when start equals end', () => {
    expect(bresenhamCells(4, 4, 4, 4)).toEqual([{ r: 4, c: 4 }]);
  });
});

describe('drawEllipseOutline', () => {
  it('does nothing for a degenerate radius of 0', () => {
    const renderFn = vi.fn();
    drawEllipseOutline(renderFn, 5, 5, 0, 0);
    expect(renderFn).not.toHaveBeenCalled();
  });

  it('emits a symmetric ring inside the bounding box', () => {
    const cells: Array<[number, number]> = [];
    drawEllipseOutline((r, c) => cells.push([r, c]), 5, 5, 3, 2);
    expect(cells.length).toBeGreaterThan(0);

    const key = (r: number, c: number) => `${r};${c}`;
    const set = new Set(cells.map(([r, c]) => key(r, c)));
    for (const [r, c] of cells) {
      // All four quadrant reflections must be present (midpoint symmetry).
      expect(set.has(key(10 - r, c))).toBe(true);
      expect(set.has(key(r, 10 - c))).toBe(true);
      expect(set.has(key(10 - r, 10 - c))).toBe(true);
      // Bounding box: rows within 5±ry (2), cols within 5±rx (3).
      expect(r).toBeGreaterThanOrEqual(3);
      expect(r).toBeLessThanOrEqual(7);
      expect(c).toBeGreaterThanOrEqual(2);
      expect(c).toBeLessThanOrEqual(8);
    }
  });

  it('plots the cardinal points of a circle', () => {
    const cells: Array<[number, number]> = [];
    drawEllipseOutline((r, c) => cells.push([r, c]), 5, 5, 2, 2);
    const set = new Set(cells.map(([r, c]) => `${r};${c}`));
    // Top, bottom, left, right extremes.
    expect(set.has('3;5')).toBe(true);
    expect(set.has('7;5')).toBe(true);
    expect(set.has('5;3')).toBe(true);
    expect(set.has('5;7')).toBe(true);
  });
});

describe('drawEllipseFill', () => {
  it('does nothing for a degenerate radius of 0', () => {
    const renderFn = vi.fn();
    drawEllipseFill(renderFn, 5, 5, 0, 0, { rows: 11, cols: 11 });
    expect(renderFn).not.toHaveBeenCalled();
  });

  it('clamps every emitted cell to the canvas bounds', () => {
    const cells: Array<[number, number]> = [];
    drawEllipseFill((r, c) => cells.push([r, c]), 0, 0, 2, 2, { rows: 3, cols: 3 });
    expect(cells.length).toBeGreaterThan(0);
    for (const [r, c] of cells) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(3);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(3);
    }
  });

  it('skips rows that fall entirely outside a tall ellipse', () => {
    const cells: Array<[number, number]> = [];
    drawEllipseFill((r, c) => cells.push([r, c]), 5, 5, 1, 2, {
      rows: 11,
      cols: 11,
    });
    expect(cells).toHaveLength(11);
    for (const [r, c] of cells) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(11);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(11);
    }
  });

  it('fills the expected cell count for a 2-radius circle on 11x11', () => {
    const cells: Array<[number, number]> = [];
    drawEllipseFill((r, c) => cells.push([r, c]), 5, 5, 2, 2, {
      rows: 11,
      cols: 11,
    });
    expect(cells).toHaveLength(21);
  });
});

describe('circleCells', () => {
  it('returns only the center cell for radius <= 0', () => {
    expect(circleCells(4, 6, 0, { rows: 9, cols: 9 })).toEqual([[4, 6]]);
    expect(circleCells(4, 6, -1, { rows: 9, cols: 9 })).toEqual([[4, 6]]);
  });

  it('fills the whole 3x3 block for radius 1', () => {
    const cells = circleCells(1, 1, 1, { rows: 3, cols: 3 });
    expect(cells).toHaveLength(9);
    expect(cells).toEqual(
      expect.arrayContaining([
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 2],
      ]),
    );
  });

  it('keeps all cells inside the canvas', () => {
    const cells = circleCells(5, 5, 2, { rows: 11, cols: 11 });
    for (const [r, c] of cells) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(11);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(11);
    }
  });
});

describe('scaleCanvas', () => {
  const realGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    // Force the no-2D-context path so the test is deterministic across
    // environments; the returned canvas dimensions are all we assert here.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = realGetContext;
  });

  it('returns a canvas scaled by the given factor', () => {
    const source = document.createElement('canvas');
    source.width = 100;
    source.height = 50;
    const scaled = scaleCanvas(source, 2);
    expect(scaled.width).toBe(200);
    expect(scaled.height).toBe(100);
  });

  it('draws the scaled image when a 2D context is available', () => {
    const drawImage = vi.fn();
    const fakeCtx = {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low',
      drawImage,
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);

    const source = document.createElement('canvas');
    source.width = 40;
    source.height = 20;
    const scaled = scaleCanvas(source, 3);

    expect(scaled.width).toBe(120);
    expect(scaled.height).toBe(60);
    expect(fakeCtx.imageSmoothingEnabled).toBe(false);
    expect(fakeCtx.imageSmoothingQuality).toBe('high');
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 120, 60);
  });
});