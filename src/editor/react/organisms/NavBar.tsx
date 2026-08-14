import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import { Menubar, type MenubarItem, type MenuEntry } from '../compounds/Menubar';
import { NewDocumentModal } from '../compounds/NewDocumentModal';
import { ExportModal } from '../compounds/ExportModal';
import { Paper } from '@mantine/core';
import { openModal } from '@mantine/modals';

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

  const menubar: MenubarItem[] = [
    { name: 'File', menu: fileMenuOptions, width: 220 },
    { name: 'Edit', menu: editMenuOptions, width: 220 },
    { name: 'View', menu: viewMenuOptions, width: 220 },
  ];

  return (
    <Paper shadow="md" p="xs" radius="xs" withBorder>
      <Menubar items={menubar} />
    </Paper>
  );
}
