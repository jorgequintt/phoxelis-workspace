import { useValue } from '@legendapp/state/react';
import { useAppContext } from './App';
import styled from 'styled-components';

export function NavBar() {
  const { ws, ed } = useAppContext();
  const modifyingPhox = useValue(ws.state$.paletteData.modifyingPhox);

  const handleNew = async () => {
    await ed.newDocumentCommand();
  };
  const handleSave = () => ed.saveDocumentCommand();
  const handleLoad = () => ed.loadDocumentCommand();
  const handleFullscreen = () => ed.toggleFullScreenCommand();
  const handleExport = () => ed.exportPhoxelisCommand();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e?.target || !(e.target instanceof HTMLInputElement)) {
      return;
    }
    if (e.target.files?.[0]) {
      ed.addReferenceImageCommand(e.target.files?.[0]);
    }
  };

  const handleMoveImgCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = (e.target as HTMLInputElement).checked;
    ws.state$.movingRefImage.set(checked);
  };

  const handleModifyPalettePhox = () => {
    ws.state$.paletteData.modifyingPhox.set(!modifyingPhox);
  };

  const undoButton = document.createElement('button');
  undoButton.innerHTML = 'Undo';
  const handleUndo = () => ws.changesStack.undoLastChange();

  const redoButton = document.createElement('button');
  redoButton.innerHTML = 'Redo';
  const handleRedo = () => ws.changesStack.redoLastChange();

  return (
    <Container>
      <button onClick={handleNew}>New</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleLoad}>Load</button>
      <button onClick={handleFullscreen}>Fullscreen</button>
      <button onClick={handleExport}>Export</button>
      <span>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <input type="checkbox" onChange={handleMoveImgCheckChange} />
      </span>
      <button onClick={handleModifyPalettePhox}>
        {modifyingPhox ? 'UPDATING PALETTE PHOX' : 'Modify Palette Phox'}
      </button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  background: #888888;
`;
