import type { Workspace } from '../Workspace';

export class LayerManager {
  ws: Workspace;

  constructor(ws: Workspace) {
    this.ws = ws;
  }

  public getDraftBaseLayer() {
    return this.ws.draftScreen.layers[0].id;
  }

  public createLayer(layerId?: string) {
    const target = this.createLayerTarget();

    const lid = layerId ?? this.ws.phoxelis.addLayer();

    this.ws.data$.layers[lid].set({
      name: `Layer #${this.ws.phoxelis.layers.length}`,
      opacity: 100,
      visible: true,
      position: this.ws.phoxelis.layers.length - 1
    });

    this.ws.layersTargets[lid] = target;

    return lid;
  }

  public removeLayer(layerId: string) {
    if (this.ws.phoxelis.layers.length === 1) {
      console.warn("removeDocumentLayer error: You can't remove the base layer.");
      return;
    }

    const layerPosition = this.ws.phoxelis.layerPositions[layerId];
    this.ws.phoxelis.removeLayer(layerId);
    this.ws.data$.layers[layerId].delete();

    const newSelectPos = Math.max(
      0,
      Math.min(this.ws.phoxelis.layers.length - 1, layerPosition),
    );
    const layerBeforeId = this.ws.phoxelis.layers[newSelectPos].id;
    this.selectLayer(layerBeforeId);
  }

  private moveLayer(...args: Parameters<typeof this.ws.phoxelis.moveLayer>) {
    this.ws.phoxelis.moveLayer(...args);
    this.ws.phoxelis.layers.forEach((l, i) => {
      this.ws.data$.layers[l.id].position.set(i);
    });
  }

  public moveLayerUp(layerId: string) {
    const layerIndex = this.ws.phoxelis.layerPositions[layerId];
    const newPosition = Math.min(
      Math.max(0, layerIndex + 1),
      this.ws.phoxelis.layers.length - 1,
    );
    this.moveLayer(layerId, newPosition);
  }
  public moveLayerDown(layerId: string) {
    const layerIndex = this.ws.phoxelis.layerPositions[layerId];
    const newPosition = Math.min(
      Math.max(0, layerIndex - 1),
      this.ws.phoxelis.layers.length - 1,
    );
    this.moveLayer(layerId, newPosition);
  }
  public moveLayerTop(layerId: string) {
    this.moveLayer(layerId, this.ws.phoxelis.layers.length - 1);
  }
  public moveLayerBottom(layerId: string) {
    this.moveLayer(layerId, 0);
  }

  public selectLayer(layerId: string) {
    this.ws.state$.activeLayer.set(layerId);
  }

  public getSortedLayers() {
    return this.ws.phoxelis.layers.map((l) => l.id).toReversed();
  }

  public createLayerTarget() {
    const target = document.createElement('canvas');
    target.width = this.ws.font.width * this.ws.config.size.cols;
    target.height = this.ws.font.height * this.ws.config.size.rows;
    target.style = `height: 100%; width: 100%; object-fit: contain;`;
    return target;
  }
}
