import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import LayerListItem from './LayerListItem';
import { ActionIcon, Group, Paper, ScrollArea, Space, Stack } from '@mantine/core';
import {
  CaretDoubleDownIcon,
  CaretDoubleUpIcon,
  CaretDownIcon,
  CaretUpIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';

export default function LayersPanel() {
  const { ws } = useAppContext();
  const layers = useValue(ws.data$.layers);
  const activeLayer = useValue(ws.state$.activeLayer);

  const handleAddLayer = () => {
    const layerId = ws.createLayer();
    ws.selectLayer(layerId);
  };

  const handleRemoveLayer = () => {
    ws.removeLayer(ws.state$.activeLayer.get());
  };

  return (
    <Paper p="md" withBorder>
      <div className="content">
        <Group justify="space-between">
          <Group>
            <ActionIcon size="xs" onClick={handleAddLayer}>
              <PlusIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleAddLayer}>
              <CaretDownIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleAddLayer}>
              <CaretDoubleDownIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleAddLayer}>
              <CaretDoubleUpIcon />
            </ActionIcon>
            <ActionIcon variant="default" size="xs" onClick={handleAddLayer}>
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
            {ws.getSortedLayers().map((layerId) => (
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
