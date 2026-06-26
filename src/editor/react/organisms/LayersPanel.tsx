import { useValue } from '@legendapp/state/react';
import { useAppContext } from '../App';
import LayerListItem from './LayerListItem';
import styled from 'styled-components';

export default function LayersPanel() {
  const { ws } = useAppContext();
  const layers = useValue(ws.data$.layers);

  const handleAddLayer = () => {
    const layerId = ws.createLayer();
    ws.selectLayer(layerId);
  };

  const handleRemoveLayer = () => {
    ws.removeLayer(ws.state$.activeLayer.get());
  };

  return (
    <Container>
      <LayerTitle>Layers</LayerTitle>
      <LayerActions>
        <ActionButton onClick={handleAddLayer}>+ Add</ActionButton>
        <ActionButton onClick={handleRemoveLayer}>− Remove</ActionButton>
      </LayerActions>
      <LayersList>
        {ws.getSortedLayers().map(layerId => (
          <LayerListItem key={layerId} layerId={layerId} layer={layers[layerId]} />
        ))}
      </LayersList>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
  border-top: 1px solid #444;
  background: #1e1e1e;
`;

const LayerTitle = styled.div`
  font-size: 12px;
  font-weight: bold;
  color: #aaa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LayersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-geight: 300px;
  overflow-g: auto;
`;

const LayerActions = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 4px 8px;
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
`;
