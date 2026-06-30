import type { LayerData } from 'phoxelis';
import type { Workspace, WorkspaceLayer } from '../Workspace';

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

    const lid = this.ws.phoxelis.addLayer(layerId);

    this.ws.data$.layers[lid].set({
      name: `Layer #${this.ws.phoxelis.layers.length}`,
      opacity: 100,
      visible: true,
      position: this.ws.phoxelis.layers.length - 1,
    });

    this.ws.layersTargets[lid] = target;

    return lid;
  }

  public getLayerId(ind: number) {
    return this.ws.phoxelis.layers[ind].id;
  }

  public deleteLayer(layerId: string) {
    const metadata = this.ws.data$.layers[layerId].get();
    const removedLayerData = this.ws.phoxelis.removeLayer(layerId);
    this.ws.data$.layers[layerId].delete();
    this.recalcPositions();
    return { metadata, layerData: removedLayerData };
  }

  public loadLayer(layerData: LayerData, layer: WorkspaceLayer) {
    const layerId = layerData!.layer.id;
    this.ws.phoxelis.loadLayer(layerData);
    this.ws.data$.layers[layerId].set(layer);
  }

  private recalcPositions() {
    this.ws.phoxelis.layers.forEach((l, i) => {
      this.ws.data$.layers[l.id].position.set(i);
    });
  }

  public setLayerPosition(...args: Parameters<typeof this.ws.phoxelis.moveLayer>) {
    this.ws.phoxelis.moveLayer(...args);
    this.recalcPositions();
  }

  public moveLayerUp(layerId: string) {
    const layerIndex = this.ws.phoxelis.layerPositions[layerId];
    const newPosition = Math.min(
      Math.max(0, layerIndex + 1),
      this.ws.phoxelis.layers.length - 1,
    );
    this.setLayerPosition(layerId, newPosition);
  }
  public moveLayerDown(layerId: string) {
    const layerIndex = this.ws.phoxelis.layerPositions[layerId];
    const newPosition = Math.min(
      Math.max(0, layerIndex - 1),
      this.ws.phoxelis.layers.length - 1,
    );
    this.setLayerPosition(layerId, newPosition);
  }
  public moveLayerTop(layerId: string) {
    const newPos = this.ws.phoxelis.layers.length - 1;
    this.setLayerPosition(layerId, newPos);
  }
  public moveLayerBottom(layerId: string) {
    this.setLayerPosition(layerId, 0);
  }

  public getSortedLayers() {
    return this.ws.phoxelis.layers.map((l) => l.id).toReversed();
  }

  public getLayerPosition(layerId: string){
    return this.ws.phoxelis.layerPositions[layerId];
  }

  public createLayerTarget() {
    const target = document.createElement('canvas');
    target.width = this.ws.font.width * this.ws.config.size.cols;
    target.height = this.ws.font.height * this.ws.config.size.rows;
    target.style = `height: 100%; width: 100%; object-fit: contain;`;
    return target;
  }

  public getNextLayer(layerId: string) {
    const layerPosition = this.ws.data$.layers[layerId].position.get();
    const newSelectPos = Math.max(
      0,
      Math.min(this.ws.phoxelis.layers.length - 1, layerPosition - 1),
    );
    return this.ws.layerManager.getLayerId(newSelectPos);
  }
}
