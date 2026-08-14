
export function scaleCanvas(
  source: HTMLCanvasElement,
  scale: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width * scale;
  canvas.height = source.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function bresenhamCells(
  r0: number,
  c0: number,
  r1: number,
  c1: number,
): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  let dr = Math.abs(r1 - r0);
  let dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dr - dc;
  let r = r0;
  let c = c0;
  while (true) {
    cells.push({ r, c });
    if (r === r1 && c === c1) break;
    const e2 = 2 * err;
    if (e2 > -dc) {
      err -= dc;
      r += sr;
    }
    if (e2 < dr) {
      err += dr;
      c += sc;
    }
  }
  return cells;
}

/** Draw ellipse outline using midpoint ellipse algorithm */
export function drawEllipseOutline(
  renderFn: (r: number, c: number) => void,
  centerR: number,
  centerC: number,
  rx: number,
  ry: number,
) {
  if (rx === 0 && ry === 0) return;
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  let x = 0;
  let y = ry;
  let d1 = ry2 - rx2 * ry + 0.25 * rx2;
  let dx = 2 * ry2 * x;
  let dy = 2 * rx2 * y;

  const plot4 = (cr: number, cc: number, dx: number, dy: number) => {
    renderFn(cr + dy, cc + dx);
    renderFn(cr - dy, cc + dx);
    renderFn(cr + dy, cc - dx);
    renderFn(cr - dy, cc - dx);
  };

  // Region 1: slope > -1
  while (dx < dy) {
    plot4(centerR, centerC, x, y);
    if (d1 < 0) {
      x++;
      dx += 2 * ry2;
      d1 += dx + ry2;
    } else {
      x++;
      y--;
      dx += 2 * ry2;
      dy -= 2 * rx2;
      d1 += dx - dy + ry2;
    }
  }

  // Region 2: slope <= -1
  let d2 = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2;
  while (y >= 0) {
    plot4(centerR, centerC, x, y);
    if (d2 > 0) {
      y--;
      dy -= 2 * rx2;
      d2 += rx2 - dy;
    } else {
      y--;
      x++;
      dx += 2 * ry2;
      dy -= 2 * rx2;
      d2 += dx - dy + rx2;
    }
  }
}

/** Fill ellipse using scanline approach with midpoint ellipse algorithm */
export function drawEllipseFill(
  renderFn: (r: number, c: number) => void,
  centerR: number,
  centerC: number,
  rx: number,
  ry: number,
  size: { rows: number; cols: number },
) {
  if (rx === 0 && ry === 0) return;

  // For each row, find the leftmost and rightmost column that falls inside the ellipse
  const halfRx = rx + 0.5;
  const halfRy = ry + 0.5;
  const rMin = centerR - halfRy;
  const rMax = centerR + halfRy;

  for (
    let r = Math.max(0, Math.floor(rMin));
    r <= Math.min(size.rows - 1, Math.ceil(rMax));
    r++
  ) {
    const dy = r - centerR;
    // ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
    // => |x-cx| <= rx * sqrt(1 - (y-cy)^2/ry^2)
    const ratio = (dy * dy) / (halfRy * halfRy);
    if (ratio > 1) continue;
    const dx = Math.sqrt(Math.max(0, 1 - ratio)) * halfRx;
    const left = Math.max(0, Math.ceil(centerC - dx));
    const right = Math.min(size.cols - 1, Math.floor(centerC + dx));
    for (let c = left; c <= right; c++) {
      renderFn(r, c);
    }
  }
}

/** Returns the cell positions within a circular radius of the center */
export function circleCells(
  centerR: number,
  centerC: number,
  radius: number,
  size: { rows: number; cols: number },
): Array<[r: number, c: number]> {
  if (radius <= 0) return [[centerR, centerC]];
  const cells: Array<[r: number, c: number]> = [];
  drawEllipseFill(
    (r, c) => cells.push([r, c]),
    centerR,
    centerC,
    radius,
    radius,
    size,
  );
  return cells;
}
