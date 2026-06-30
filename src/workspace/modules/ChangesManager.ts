import type { Change } from './Actions';

const maxChangesHistory = 100;

export class ChangesManager {
  changesHistory: Array<Change> = [];
  redoHistory: Array<Change> = [];

  addChange = (change: Change) => {
    if (this.changesHistory.length === maxChangesHistory) this.changesHistory.shift();
    this.changesHistory.push(change);
    this.redoHistory = [];
  };

  undoLastChange = () => {
    const lastChange = this.changesHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to undo');
      return;
    }

    lastChange.undo();
    this.redoHistory.push(lastChange);
  };

  redoLastChange = () => {
    const lastChange = this.redoHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to redo');
      return;
    }

    lastChange.execute();
    this.changesHistory.push(lastChange);
  };
}
