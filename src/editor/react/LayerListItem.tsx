import { useEffect, useRef } from 'react';
import type { WorkspaceLayer } from '../../workspace/Workspace';
import { useAppContext } from './App';

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
    <div
      className="layer-row"
      id={`layer-${layerId}`}
      onClick={handleLayerClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        background: '#2a2a2a',
        border: '1px solid #3a3a3a',
        borderRadius: '3px',
        cursor: 'grab' as const,
        userSelect: 'none',
        transition: 'background 0.1s'
      }}
    >
      <div className="drag-handle" style={{
        width: '16px',
        height: '28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        flexShrink: 0,
        cursor: 'grab' as const,
        touchAction: 'none',
        userSelect: 'none'
      }}>
        <span style={{ fontSize: '15px', lineHeight: 1, color: '#666' }}>⠿</span>
      </div>

      <div ref={previewContainerRef} className="preview-container" style={{
        width: '28px',
        height: '28px',
        background: '#1a1a1a',
        border: '1px solid #444',
        borderRadius: '2px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} />

      <input
        className="name-input"
        type="text"
        value={layer.name}
        onChange={handleNameChange}
        style={{
          flex: 1,
          minWidth: 0,
          padding: '2px 4px',
          background: '#1a1a1a',
          border: '1px solid #444',
          borderRadius: '2px',
          color: '#ccc',
          fontSize: '11px',
          outline: 'none'
        }}
      />

      <input
        className="opacity-slider"
        type="range"
        min="0"
        max="100"
        value={layer.opacity}
        onChange={handleOpacityChange}
        style={{
          width: '50px',
          height: '4px',
          accentColor: '#666',
          flexShrink: 0
        }}
      />

      <button
        className="eye-btn"
        onClick={handleVisibilityChange}
        style={{
          width: '24px',
          height: '24px',
          background: 'transparent',
          border: '1px solid #444',
          borderRadius: '2px',
          fontSize: '14px',
          cursor: 'pointer' as const,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: layer.visible ? 1 : 0.4
        }}
      >
        {layer.visible ? '👁‍🗨' : '👁'}
      </button>
    </div>
  );
}
