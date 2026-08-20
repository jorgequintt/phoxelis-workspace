import { Fragment } from 'react';
import { Divider, Group, Kbd, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { MenuIcon } from '../atoms/MenuIcon';
import styled from 'styled-components';

const TOOLS: { icon: string; name: string; description: string }[] = [
  {
    icon: 'selection',
    name: 'Select',
    description:
      'Drag to mark a rectangular area, then copy, cut, paste, delete, or arrow-move it.',
  },
  {
    icon: 'pencil',
    name: 'Draw',
    description:
      'Paint freehand strokes with the current char and colors. Adjust the stroke radius in the toolbar.',
  },
  {
    icon: 'square',
    name: 'Rectangle',
    description: 'Drag from one corner to the opposite to draw an outline rectangle.',
  },
  {
    icon: 'squareFill',
    name: 'Filled Rectangle',
    description: 'Same as Rectangle, but filled in.',
  },
  {
    icon: 'lineSegment',
    name: 'Line',
    description: 'Drag between two points to draw a straight line.',
  },
  {
    icon: 'circle',
    name: 'Ellipse',
    description: 'Drag a bounding box to draw an outline ellipse.',
  },
  {
    icon: 'circleFill',
    name: 'Filled Ellipse',
    description: 'Same as Ellipse, but filled in.',
  },
  {
    icon: 'textT',
    name: 'Text',
    description:
      'Click to place the text cursor, then type glyphs. Enter moves to the next row.',
  },
  {
    icon: 'columns',
    name: 'Mirror',
    description:
      'Toggle symmetric drawing around a point. Set or clear the mirror point in the toolbar.',
  },
];

const DRAW_MODES: { icon: string; name: string; description: string }[] = [
  {
    icon: 'pencil',
    name: 'Draw',
    description: 'Writes the full phox: char + foreground + background at once.',
  },
  {
    icon: 'textAa',
    name: 'Char only',
    description: 'Changes only the glyph, keeping the existing colors.',
  },
  {
    icon: 'circleFill',
    name: 'Foreground only',
    description: 'Changes only the foreground color.',
  },
  {
    icon: 'circle',
    name: 'Background only',
    description: 'Changes only the background color.',
  },
  {
    icon: 'circleHalf',
    name: 'Color',
    description: 'Changes foreground + background together, keeping the glyph.',
  },
  {
    icon: 'eraser',
    name: 'Erase',
    description: 'Removes phoxes from the layer.',
  },
  {
    icon: 'play',
    name: 'Motion',
    description:
      'Cycles through the selected motion\u2019s char sequence on each stroke. Pick a motion and Loop/Hold in the toolbar.',
  },
];

const VERSIONING_FEATURES: { name: string; description: string }[] = [
  {
    name: 'Versions',
    description:
      'Every stroke is recorded as a step in the current branch. Use the \u25C0 \u25B6 arrows or the step dropdown to step back and forth in time.',
  },
  {
    name: 'Add version',
    description:
      'Insert a new empty step as a checkpoint \u2014 everything drawn afterwards becomes a separate version you can jump back to.',
  },
  {
    name: 'New branch',
    description:
      'Fork from the current state to experiment freely without touching the main line. The tree shows how branches relate to each other.',
  },
  {
    name: 'Go to parent',
    description: 'Jump back to the branch the current one was created from.',
  },
  {
    name: 'Reset',
    description: 'Collapse the entire history into a single starting point.',
  },
];

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['Ctrl', 'Z'], action: 'Undo last change' },
  { keys: ['Ctrl', 'Y'], action: 'Redo last change' },
  { keys: ['Ctrl', 'C'], action: 'Copy selection' },
  { keys: ['Ctrl', 'X'], action: 'Cut selection' },
  { keys: ['Ctrl', 'V'], action: 'Paste clipboard' },
  { keys: ['Del'], action: 'Delete selection' },
  { keys: ['Arrow keys'], action: 'Move selection' },
  { keys: ['Esc'], action: 'Clear selection / cancel text' },
  { keys: ['Ctrl', 'Shift', 'O'], action: 'New document' },
  { keys: ['Ctrl', 'S'], action: 'Save document' },
  { keys: ['Ctrl', 'O'], action: 'Load document' },
  { keys: ['Ctrl', 'Drag'], action: 'Pan the canvas' },
  { keys: ['Shift', 'Drag'], action: 'Zoom the canvas' },
];

export function StartModal() {
  return (
    <ScrollArea.Autosize mah={440} offsetScrollbars>
      <Stack gap="lg" pr="xs">
        <Stack gap="xs">
          <Text size="sm" c="dimmed">
            Phoxelis is a browser-based phoxel art editor — a blend of pixel art and
            terminal art. Every canvas cell is a <b>phox</b>: a glyph from a bitmap font
            combined with a foreground and a background color.
          </Text>
          <Text size="sm" c="dimmed">
            Pick a glyph from the alphabet and choose the foreground/background colors in
            the sidebar, then draw on the canvas with the tools on the left. Every action
            is undoable with <Kbd>Ctrl</Kbd> + <Kbd>Z</Kbd>. Organize your work with
            layers, animate glyphs with motions, and use the per-layer version history to
            branch and iterate on your art.
          </Text>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={5}>Tools</Title>
          {TOOLS.map((t) => (
            <ToolRow key={t.name}>
              <ToolIcon>
                <MenuIcon name={t.icon} />
              </ToolIcon>
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {t.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {t.description}
                </Text>
              </Stack>
            </ToolRow>
          ))}
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={5}>Draw modes</Title>
          <Text size="xs" c="dimmed">
            The draw mode controls which parts of a phox a stroke touches. Pick one from
            the second vertical bar next to the tools.
          </Text>
          {DRAW_MODES.map((m) => (
            <ToolRow key={m.name}>
              <ToolIcon>
                <MenuIcon name={m.icon} />
              </ToolIcon>
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {m.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {m.description}
                </Text>
              </Stack>
            </ToolRow>
          ))}
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={5}>Versioning</Title>
          <Text size="xs" c="dimmed">
            The Versioning panel at the bottom of the sidebar keeps a git-like history for
            the active layer. Use it to step backwards, checkpoint, and branch your work.
          </Text>
          {VERSIONING_FEATURES.map((f) => (
            <Stack key={f.name} gap={0}>
              <Text size="sm" fw={600}>
                {f.name}
              </Text>
              <Text size="xs" c="dimmed">
                {f.description}
              </Text>
            </Stack>
          ))}
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Title order={5}>Shortcuts</Title>
          {SHORTCUTS.map((s) => (
            <ShortcutRow key={s.action}>
              <Text size="xs">{s.action}</Text>
              <Group gap={4} wrap="nowrap">
                {s.keys.map((k, i) => (
                  <Fragment key={`${s.action}-${k}`}>
                    {i > 0 && <Plus>+</Plus>}
                    <Kbd>{k}</Kbd>
                  </Fragment>
                ))}
              </Group>
            </ShortcutRow>
          ))}
        </Stack>
      </Stack>
    </ScrollArea.Autosize>
  );
}

const ToolRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const ToolIcon = styled.div`
  width: 24px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-top: 2px;
`;

const ShortcutRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Plus = styled.span`
  color: #888;
  font-size: 12px;
`;