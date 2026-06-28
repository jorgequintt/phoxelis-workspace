import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import styled from 'styled-components';
import { Menubar, type MenubarItem, type MenuEntry } from '../compounds/Menubar';
import { Card } from '@mantine/core';

export function NavBar() {
  const { ws, ed } = useAppContext();
  const modifyingPhox = useValue(ws.state$.paletteData.modifyingPhox);
  const movingRefImage = useValue(ws.state$.movingRefImage);

  const fileMenuOptions: MenuEntry[] = [
    { type: 'option', name: 'New', command: () => ed.newDocumentCommand(), hotkey: '^⇧O' },
    {
      type: 'option',
      name: 'Save',
      command: () => ed.saveDocumentCommand(),
      hotkey: '^S',
    },
    {
      type: 'option',
      name: 'Load',
      command: () => ed.loadDocumentCommand(),
      hotkey: '^O',
    },
    {
      type: 'option',
      name: 'Export',
      command: () => ed.exportPhoxelisCommand(),
    },
  ];

  const editMenuOptions: MenuEntry[] = [
    {
      type: 'option',
      name: 'Undo',
      command: () => ws.changesStack.undoLastChange(),
      hotkey: '^Z',
    },
    {
      type: 'option',
      name: 'Redo',
      command: () => ws.changesStack.redoLastChange(),
      hotkey: '^Y',
    },
    { type: 'divider' },
    {
      type: 'option',
      checked: modifyingPhox,
      name: 'Modify Palette Phox',
      command: () => ed.toggleModifyPalettePhoxCommand(),
    },
    { type: 'divider' },
    {
      type: 'option',
      name: 'Add reference image',
      command: () => ed.addReferenceImageCommand(),
    },
    {
      type: 'option',
      checked: movingRefImage,
      name: 'Pan/Zoom Reference Image',
      command: () => ed.toggleMovingRefImage(),
    },
  ];

  const menubar: MenubarItem[] = [
    { name: 'File', menu: fileMenuOptions, width: 220 },
    { name: 'Edit', menu: editMenuOptions, width: 220 },
  ];

  return (
      <Card shadow="md" padding="xs" radius="xs" withBorder>
      <Menubar items={menubar} />
      </Card>
  );
}

const Container = styled.div`
  width: 100%;
  background: #888888;
`;
