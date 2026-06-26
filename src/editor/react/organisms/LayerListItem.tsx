import { useEffect, useRef } from 'react';
import type { WorkspaceLayer } from '../../../workspace/Workspace';
import { useAppContext } from '../App';
import styled from 'styled-components';

interface Props {
  layerId: string;
  layer: WorkspaceLayer;
}

export default function LayerListItem({ layerId, layer }: Props) {
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
    layer.name = e.target.value;
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    layer.opacity = parseInt(e.target.value);
  };

  const handleVisibilityChange = (e: React.MouseEvent) => {
    layer.visible = !layer.visible;
    e.stopPropagation();
  };

  return (
    <LayerRow id={`layer-${layerId}`} onClick={handleLayerClick}>
      <DragHandle>⠿</DragHandle>

      <PreviewContainer ref={previewContainerRef} />

      <NameInput type="text" value={layer.name} onChange={handleNameChange} />

      <OpacitySlider
        type="range"
        min="0"
        max="100"
        value={layer.opacity}
        onChange={handleOpacityChange}
      />

      <EyeBtn onClick={handleVisibilityChange} opacity={layer.visible ? 1 : 0.4}>
        {layer.visible ? '👁‍🗨' : '👁'}
      </EyeBtn>
    </LayerRow>
  );
}

const LayerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 3px;
  cursor: grab;
  user-select: none;
  transition: background 0.1s;
`;

const DragHandle = styled.div`
  width: 16px;
  height: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  font-size: 18px;
  line-height: 1;
  color: #666;
`;

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

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 2px 4px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 2px;
  color: #ccc;
  font-size: 11px;
  outline: none;
`;

const OpacitySlider = styled.input`
  width: 50px;
  height: 4px;
  accent-color: #666;
  flex-shrink: 0;
`;

const EyeBtn = styled.button<{ opacity?: number }>`
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 2px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: ${(props) => props.opacity ?? 1};
`;
