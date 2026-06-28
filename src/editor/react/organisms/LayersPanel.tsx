import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import LayerListItem from './LayerListItem';
import styled from 'styled-components';
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Paper,
  ScrollArea,
  Space,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useFloatingWindow } from '@mantine/hooks';
import { PlusCircleIcon, TrashIcon } from '@phosphor-icons/react';

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
        <Group justify="end">
          <ActionIcon variant="default" size="xs" onClick={handleAddLayer}>
            <PlusCircleIcon />
          </ActionIcon>
          <ActionIcon variant="default" size="xs" onClick={handleRemoveLayer}>
            <TrashIcon />
          </ActionIcon>
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
