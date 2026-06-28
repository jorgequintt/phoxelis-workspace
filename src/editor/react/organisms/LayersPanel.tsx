import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import LayerListItem from './LayerListItem';
import { ActionIcon, Group, Paper, ScrollArea, Space, Stack } from '@mantine/core';
import { CaretDoubleDownIcon } from '@phosphor-icons/react/dist/csr/CaretDoubleDown';
import { CaretDoubleUpIcon } from '@phosphor-icons/react/dist/csr/CaretDoubleUp';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretUpIcon } from '@phosphor-icons/react/dist/csr/CaretUp';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';


export default function LayersPanel() {
  const { ws } = useAppContext();
  const layers = useValue(ws.data$.layers);
  const activeLayer = useValue(ws.state$.activeLayer);

  const lm = ws.layerManager;

  const handleMoveLayerBottom = () => {
    lm.moveLayerBottom(activeLayer);
  }

  const handleMoveLayerTop = () => {
    lm.moveLayerTop(activeLayer);
  }

  const handleMoveLayerUp = () => {
    lm.moveLayerUp(activeLayer);
  }

  const handleMoveLayerDown = () => {
    lm.moveLayerDown(activeLayer);
  }

  const handleAddLayer = () => {
    const layerId = lm.createLayer();
    lm.selectLayer(layerId);
  };

  const handleRemoveLayer = () => {
    lm.removeLayer(ws.state$.activeLayer.get());
  };

  return (
    <Paper p="md" withBorder>
      <div className="content">
        <Group justify="space-between">
          <Group>
            <ActionIcon size="xs" onClick={handleAddLayer}>
              <PlusIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleMoveLayerDown}>
              <CaretDownIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleMoveLayerBottom}>
              <CaretDoubleDownIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleMoveLayerTop}>
              <CaretDoubleUpIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleMoveLayerUp}>
              <CaretUpIcon />
            </ActionIcon>
          </Group>
          <Group>
            <ActionIcon color="red" size="xs" onClick={handleRemoveLayer}>
              <TrashIcon />
            </ActionIcon>
          </Group>
        </Group>
        <Space h="md" />
        <ScrollArea h={150}>
          <Stack gap="xs">
            {lm.getSortedLayers().map((layerId) => (
              <LayerListItem
                key={layerId}
                layerId={layerId}
                layer={layers[layerId]}
                active={layerId === activeLayer}
              />
            ))}
          </Stack>
        </ScrollArea>
      </div>
    </Paper>
  );
}
