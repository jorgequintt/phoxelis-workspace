import { useAppContext } from '../App';
import { Button, Paper, SegmentedControl, Select, Tooltip } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { FloppyDiskIcon } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { ArrowUpIcon } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { ArrowDownIcon } from '@phosphor-icons/react/dist/csr/ArrowDown';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { CopyIcon } from '@phosphor-icons/react/dist/csr/Copy';
import { ScissorsIcon } from '@phosphor-icons/react/dist/csr/Scissors';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/csr/ClipboardText';
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
  const mirrorEnabled = useValue(ws.state$.mirrorEnabled);
  const mirrorSelectingPoint = useValue(ws.state$.mirrorSelectingPoint);
  const mirrorPoint = useValue(ws.state$.mirrorPoint);
  const selection = useValue(ws.state$.selection);
  const clipboard = useValue(ws.state$.clipboard);

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
        {mirrorEnabled && (
          <ToolbarSection>
            <OptionLabel>Mirror</OptionLabel>
            <Button
              size="xs"
              variant={mirrorSelectingPoint ? 'filled' : 'default'}
              onClick={() =>
                ws.state$.mirrorSelectingPoint.set(!mirrorSelectingPoint)
              }
            >
              Set point
            </Button>
            <OptionValue>
              {mirrorPoint ? `${mirrorPoint.r}, ${mirrorPoint.c}` : '—'}
            </OptionValue>
            <Button
              size="xs"
              variant="default"
              onClick={() => ws.state$.mirrorPoint.set(null)}
            >
              Clear
            </Button>
          </ToolbarSection>
        )}
        {currentTool === 'select' && (
          <ToolbarSection>
            <Tooltip label="Copy (Ctrl+C)" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.copy()}
              >
                <CopyIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            <Tooltip label="Cut (Ctrl+X)" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.cut()}
              >
                <ScissorsIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            <Tooltip label="Paste (Ctrl+V)" position="bottom">
              <ToolbarButton
                disabled={!clipboard}
                onClick={() => ws.selectionManager.paste()}
              >
                <ClipboardTextIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            <Tooltip label="Delete (Del)" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.remove()}
              >
                <TrashIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
          </ToolbarSection>
        )}
        {currentTool === 'select' && (
          <ToolbarSection>
            <Tooltip label="Move left" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.move(0, -1)}
              >
                <ArrowLeftIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            <Tooltip label="Move up" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.move(-1, 0)}
              >
                <ArrowUpIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            <Tooltip label="Move down" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.move(1, 0)}
              >
                <ArrowDownIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
            <Tooltip label="Move right" position="bottom">
              <ToolbarButton
                disabled={!selection}
                onClick={() => ws.selectionManager.move(0, 1)}
              >
                <ArrowRightIcon size={iconSize} />
              </ToolbarButton>
            </Tooltip>
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

  &:disabled {
    background: #333;
    color: #666;
    cursor: not-allowed;
  }
`;