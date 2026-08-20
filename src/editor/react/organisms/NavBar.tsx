import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import { Menubar, type MenubarItem, type MenuEntry } from '../compounds/Menubar';
import { NewDocumentModal } from '../compounds/NewDocumentModal';
import { ExportModal } from '../compounds/ExportModal';
import { openSplashScreen } from '../compounds/SplashScreen';
import { openStartModal } from '../compounds/StartModal';
import { openAboutModal } from '../compounds/AboutModal';
import { Button, Paper, Tooltip } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { FrameCornersIcon } from '@phosphor-icons/react/dist/csr/FrameCorners';
import styled from 'styled-components';

export function NavBar() {
  const { ws, ed } = useAppContext();
  const modifyingPhox = useValue(ws.state$.paletteData.modifyingPhox);
  const movingRefImage = useValue(ws.state$.movingRefImage);

  const fileMenuOptions: MenuEntry[] = [
    {
      type: 'option',
      name: 'New',
      command: () =>
        openModal({
          title: 'New Document',
          children: <NewDocumentModal />,
        }),
      hotkey: '^⇧O',
    },
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
      name: 'Export PNG',
      command: () =>
        openModal({
          title: 'Export PNG',
          children: <ExportModal onSubmit={(scale) => ed.exportPngCommand(scale)} />,
        }),
    },
    {
      type: 'option',
      name: 'Export .phoxelis',
      command: () => ed.exportPhoxelisCommand(),
    },
  ];

  const editMenuOptions: MenuEntry[] = [
    {
      type: 'option',
      name: 'Undo',
      command: () => ws.changesManager.undoLastChange(),
      hotkey: '^Z',
    },
    {
      type: 'option',
      name: 'Redo',
      command: () => ws.changesManager.redoLastChange(),
      hotkey: '^Y',
    },
    { type: 'divider' },
    {
      type: 'option',
      name: 'Copy',
      command: () => ws.selectionManager.copy(),
      hotkey: '^C',
    },
    {
      type: 'option',
      name: 'Cut',
      command: () => ws.selectionManager.cut(),
      hotkey: '^X',
    },
    {
      type: 'option',
      name: 'Paste',
      command: () => ws.selectionManager.paste(),
      hotkey: '^V',
    },
    {
      type: 'option',
      name: 'Delete Selection',
      command: () => ws.selectionManager.remove(),
      hotkey: 'Del',
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
      name: 'Pan/Zoom ref. Image',
      command: () => ed.toggleMovingRefImage(),
    },
  ];

  const viewMenuOptions: MenuEntry[] = [
    {
      type: 'option',
      name: 'Fullscreen',
      command: () => ed.toggleFullScreenCommand(),
    }
  ];

  const helpMenuOptions: MenuEntry[] = [
    {
      type: 'option',
      name: 'Getting started',
      command: () =>
        openStartModal()
    },
    {
      type: 'option',
      name: 'Splash screen',
      command: () => openSplashScreen(),
    },
    {
      type: 'option',
      name: 'About',
      command: () =>
        openAboutModal()
    },
  ];

  const menubar: MenubarItem[] = [
    { name: 'File', menu: fileMenuOptions, width: 220 },
    { name: 'Edit', menu: editMenuOptions, width: 220 },
    { name: 'View', menu: viewMenuOptions, width: 220 },
    { name: 'Help', menu: helpMenuOptions, width: 220 },
  ];

  return (
    <Paper shadow="md" p="xs" radius="xs" withBorder>
      <NavBarInner>
        <Menubar items={menubar} />
        <Tooltip label="Fullscreen" position="bottom">
          <Button variant='subtle' onClick={() => ed.toggleFullScreenCommand()} size='compact-xs'>
            <FrameCornersIcon size={22} />
          </Button>
        </Tooltip>
      </NavBarInner>
    </Paper>
  );
}

const NavBarInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
