<script lang="ts">
  import _ from "lodash";
  import { getAppContext } from "../AppContext";
  import LayerListItem from "./LayerListItem.svelte";

  const {ws} = getAppContext();

 const handleAddLayer = () => {
    const layerId = ws.createLayer();
    ws.selectLayer(layerId);
  }

  const handleRemoveLayer = () => {
    ws.removeLayer(ws.state.activeLayer);
  }
</script>

<div class="layer-panel">
  <div class="layers-panel-title">Layers</div>
  <div class="layer-actions">
    <button onclick={handleAddLayer} class="action-btn">+ Add</button>
    <button onclick={handleRemoveLayer} class="action-btn">- Remove</button>
  </div>
  <div class="layer-list">
    {#each _.entries(ws.data.layers) as [layerId, layer] (layerId)}
      <LayerListItem {layer} {layerId} />
    {/each}
  </div>
</div>

<style>
  .layer-panel {
    padding: 8px;
    border-top: 1px solid #444;
    background: #1e1e1e;
  }
  .layer-actions {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
  }
  .layer-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 300px;
    overflow-y: auto;
  }
  .action-btn {
    flex: 1;
    padding: 4px 8px;
    background: #444;
    color: #ccc;
    border: 1px solid #555;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
  }
  .layers-panel-title {
    font-size: 12px;
    font-weight: bold;
    color: #aaa;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
