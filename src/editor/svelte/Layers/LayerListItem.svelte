<script lang="ts">
  import type { DocumentLayer } from '../../../workspace/Workspace';
  import { getAppContext } from '../AppContext';

  interface Props {
    layerId: string;
    layer: DocumentLayer;
  }
  let { layerId, layer }: Props = $props();
  const { ws } = getAppContext();

  let previewContainer: HTMLDivElement;

  $effect(() => {
    let layerTarget = ws.layersTargets[layerId];
    if (layerTarget) {
      previewContainer.appendChild(ws.layersTargets[layerId]);
    } else {
      console.error(`LayerListItem ${layerId}: No layer target for preview found`);
    }
    return () => {
      if (layerTarget) layerTarget.remove();
    };
  });

  const handleLayerClick = () => {
    ws.state.activeLayer = layerId;
  };

  const handleNameChange = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
      layer.name = e.target.value;
    }
  };

  const handleOpacityChange = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
      layer.opacity = parseInt(e.target.value);
    }
  };

  const handleVisibilityChange = (e: Event) => {
    layer.visible = !layer.visible;
    e.stopPropagation();
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="layer-row"
  id="layer-{layerId}"
  onclick={handleLayerClick}
>
  <div class="drag-handle"><span>⠿</span></div>
  <div bind:this={previewContainer} class="preview-container"></div>
  <input class="name-input" type="text" value={layer.name} onchange={handleNameChange} />
  <input
    class="opacity-slider"
    type="range"
    min="0"
    max="100"
    value={layer.opacity}
    onchange={handleOpacityChange}
  />
  <button
    class="eye-btn"
    style="opacity: {layer.visible ? 1 : 0.4};"
    onclick={handleVisibilityChange}>{layer.visible ? '👁‍🗨' : '👁'}</button
  >
</div>

<style>
  .layer-row {
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
  }

  .layer-row .drag-handle {
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
  }

  .drag-handle span {
    font-size: 15px;
    line-height: 1;
    color: #666;
  }

  .preview-container {
    width: 28px;
    height: 28px;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 2px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .name-input {
    flex: 1;
    min-width: 0;
    padding: 2px 4px;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 2px;
    color: #ccc;
    font-size: 11px;
    outline: none;
  }

  .opacity-slider {
    width: 50px;
    height: 4px;
    accent-color: #666;
    flex-shrink: 0;
  }

  .eye-btn {
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
  }
</style>
