import { useEffect, useRef } from 'react';
import type { WorkspaceLayer } from '../../../workspace/Workspace';
import { useAppContext } from '../App';
import styled from 'styled-components';
import { ActionIcon, Card, Group, Slider, TextInput } from '@mantine/core';

interface Props {
  layerId: string;
  layer: WorkspaceLayer;
  active: boolean;
}

export default function LayerListItem({ layerId, layer, active }: Props) {
  const { ws } = useAppContext();
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layerTarget = ws.layersTargets[layerId];
    if (layerTarget && previewContainerRef.current) {
      previewContainerRef.current.appendChild(layerTarget);
    } else if (!layerTarget) {
      console.error(`LayerListItem ${layerId}: No layer target for preview found`);
    }
    return () => {
      if (layerTarget && previewContainerRef.current?.contains(layerTarget)) {
        layerTarget.remove();
      }
    };
  }, [ws, layerId]);

  const handleLayerClick = () => {
    ws.state$.activeLayer.set(layerId);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    ws.data$.layers[layerId].name.set(e.target.value);
  };

  const handleOpacityChange = (opacity: number) => {
    ws.data$.layers[layerId].opacity.set(opacity);
  };

  const handleVisibilityChange = (e: React.MouseEvent) => {
    ws.data$.layers[layerId].visible.set(!layer.visible);
    e.stopPropagation();
  };

  return (
    <Card
      id={`layer-${layerId}`}
      onClick={handleLayerClick}
      withBorder
      p="xs"
      bg={active ? 'gray.7' : undefined}
    >
      <Group>
        <PreviewContainer ref={previewContainerRef} />
        <TextInput size="xs" flex={1} value={layer.name} onChange={handleNameChange} />
        <Slider
          label={null}
          color="gray.5"
          w={50}
          min={0}
          max={100}
          value={layer.opacity}
          onChange={handleOpacityChange}
        />
        <ActionIcon
          variant="default"
          onClick={handleVisibilityChange}
          opacity={layer.visible ? 1 : 0.4}
        >
          {layer.visible ? '👁‍🗨' : '👁'}
        </ActionIcon>
      </Group>
    </Card>
  );
}

const PreviewContainer = styled.div`
  width: 28px;
  height: 28px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 2px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;
