import { useAppContext } from '../App';
import { Paper, Tooltip } from '@mantine/core';
import { FloppyDiskIcon } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import styled from 'styled-components';

const iconSize = 24;

export function Toolbar() {
  const { ws, ed } = useAppContext();

  return (
    <Paper shadow="md" p="xs" radius="xs" withBorder>
      <ToolbarInner>
        <Tooltip label="Save (Ctrl+S)" position="bottom">
          <ToolbarButton onClick={() => ed.saveDocumentCommand()}>
            <FloppyDiskIcon size={iconSize} />
          </ToolbarButton>
        </Tooltip>
        <Tooltip label="Undo (Ctrl+Z)" position="bottom">
          <ToolbarButton onClick={() => ws.changesManager.undoLastChange()}>
            <ArrowCounterClockwiseIcon size={iconSize} />
          </ToolbarButton>
        </Tooltip>
        <Tooltip label="Redo (Ctrl+Y)" position="bottom">
          <ToolbarButton onClick={() => ws.changesManager.redoLastChange()}>
            <ArrowClockwiseIcon size={iconSize} />
          </ToolbarButton>
        </Tooltip>
      </ToolbarInner>
    </Paper>
  );
}

const ToolbarInner = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`;

const ToolbarButton = styled.button`
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 6px;
  width: 34px;
  height: 34px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: #666;
  }

  &:active {
    background: #888;
  }
`;
