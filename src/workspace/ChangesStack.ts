import type { PhoxelPosition, Workspace } from "./Workspace";

export function createChangesStack(ws: Workspace){
  const {session, phoxelis} = ws;

  type ChangesStack = Array<() => void>;
  let changesHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
  let redoHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
  const maxChangesHistory = 50;

  const commitPhoxels = (phoxelPositions: Array<PhoxelPosition>) => {
    const undoChanges: ChangesStack = [];
    const changes: ChangesStack = [];
    const currentLayerId = session.activeLayer; // Captured for undo/redo funcs

    phoxelPositions.forEach(([r, c]) => {
      const origPhox = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!origPhox) {
        // Note: Pass currentLayerId, not session.activeLayer to funcs
        undoChanges.push(() => phoxelis.removePhoxel(r, c, currentLayerId));
      } else {
        undoChanges.push(() =>
          phoxelis.renderPhoxel(
            origPhox.char,
            origPhox.fg,
            origPhox.bg,
            r,
            c,
            currentLayerId,
          ),
        );
      }

      ws.renderDpWithMode(phoxelis, r, c, session.activeLayer);

      const newPhox = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!newPhox) {
        changes.push(() => phoxelis.removePhoxel(r, c, currentLayerId));
      } else {
        changes.push(() =>
          phoxelis.renderPhoxel(
            newPhox.char,
            newPhox.fg,
            newPhox.bg,
            r,
            c,
            currentLayerId,
          ),
        );
      }
    });

    if (changesHistory.length === maxChangesHistory) changesHistory.shift();
    changesHistory.push({ changes, undoChanges });
    redoHistory = [];
  }

  const undoLastChange = () => {
    const lastChange = changesHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to undo');
      return;
    }

    lastChange.undoChanges.forEach((fn) => fn());
    redoHistory.push(lastChange);
  }

  const redoLastChange = () => {
    const lastChange = redoHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to redo');
      return;
    }

    lastChange.changes.forEach((fn) => fn());
    changesHistory.push(lastChange);
  }

  return {undoLastChange, redoLastChange, commitPhoxels}
}