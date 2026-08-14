import { useAppContext } from '../App';
import { Paper, SegmentedControl, Select, Tooltip } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { FloppyDiskIcon } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { useValue } from '@legendapp/state/react';
import styled from 'styled-components';
import { MotionModal } from '../compounds/MotionModal';

const iconSize = 24;

export function Toolbar() {
  const { ws, ed } = useAppContext();
  const currentTool = useValue(ws.state$.tool);
  const drawMode = useValue(ws.state$.drawMode);
  const pencilRadius = useValue(ws.state$.pencilRadius);
  const motions = useValue(ws.data$.motions);
  const activeMotionId = useValue(ws.state$.activeMotionId);
  const motionWrap = useValue(ws.state$.motionWrap);

  const motionOptions = Object.values(motions).map((m) => ({
    value: m.id,
    label: m.name,
  }));
  const activeMotion = activeMotionId ? motions[activeMotionId] : undefined;

  const deleteActiveMotion = () => {
    if (!activeMotionId) return;
    ws.data$.motions[activeMotionId].delete();
    ws.state$.activeMotionId.set(null);
  };

  return (
    <Paper shadow="md" p="xs" radius="xs" withBorder>
      <ToolbarInner>
        <ToolbarSection>
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
        </ToolbarSection>
        {currentTool === 'draw' && (
          <ToolbarSection>
            <OptionLabel>Radius</OptionLabel>
            <input
              type="range"
              min={0}
              max={10}
              value={pencilRadius}
              onChange={(e) =>
                ws.state$.pencilRadius.set(Number(e.target.value))
              }
            />
            <OptionValue>{pencilRadius}</OptionValue>
          </ToolbarSection>
        )}
        {drawMode === 'motion' && (
          <ToolbarSection>
            <Select
              size="xs"
              w={150}
              placeholder="Select motion"
              data={motionOptions}
              value={activeMotionId ?? null}
              onChange={(v) => ws.state$.activeMotionId.set(v)}
            />
            <Tooltip label="New motion" position="bottom">
              <ToolbarButton
                onClick={() =>
                  openModal({
                    title: 'New Motion',
                    children: <MotionModal />,
                  })
                }
              >
                <PlusIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            {activeMotion && (
              <Tooltip label="Delete motion" position="bottom">
                <ToolbarButton onClick={deleteActiveMotion}>
                  <TrashIcon size={iconSize} />
                </ToolbarButton>
              </Tooltip>
            )}
            <SegmentedControl
              size="xs"
              value={motionWrap ? 'loop' : 'hold'}
              onChange={(v) => ws.state$.motionWrap.set(v === 'loop')}
              data={[
                { label: 'Loop', value: 'loop' },
                { label: 'Hold', value: 'hold' },
              ]}
            />
          </ToolbarSection>
        )}
      </ToolbarInner>
    </Paper>
  );
}

const ToolbarInner = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ToolbarSection = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;

  & + & {
    padding-left: 10px;
    border-left: 1px solid #555;
  }
`;

const OptionLabel = styled.span`
  color: #ccc;
  font-size: 13px;
`;

const OptionValue = styled.span`
  color: #ccc;
  font-size: 13px;
  min-width: 20px;
  text-align: center;
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