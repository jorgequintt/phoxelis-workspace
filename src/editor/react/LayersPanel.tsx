import { useValue } from '@legendapp/state/react';
import { useAppContext } from './App';
import LayerListItem from './LayerListItem';

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
    <div style={{
      padding: '8px',
      borderTop: '1px solid #444',
      background: '#1e1e1e'
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#aaa',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>Layers</div>
      <div style={{
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
        maxHeight: '300px',
        overflowY: 'auto' as const
      }}>
        {Object.entries(layers).map(([layerId, layer]) => (
          <LayerListItem key={layerId} layerId={layerId} layer={layer} />
        ))}
      </div>
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '8px'
      }}>
        <button onClick={handleAddLayer} style={{
          flex: 1,
          padding: '4px 8px',
          background: '#444',
          color: '#ccc',
          border: '1px solid #555',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer' as const
        }}>+ Add</button>
        <button onClick={handleRemoveLayer} style={{
          flex: 1,
          padding: '4px 8px',
          background: '#444',
          color: '#ccc',
          border: '1px solid #555',
          borderRadius: '3px',
          fontSize: '11px',
          cursor: 'pointer' as const
        }}>− Remove</button>
      </div>
    </div>
  );
}
