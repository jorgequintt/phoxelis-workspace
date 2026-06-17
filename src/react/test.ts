//////////////////////////////////////////////////////////////////////////////////////
// MARK: Session.ts
//////////////////////////////////////////////////////////////////////////////////////
const doc: any = {
  size: {rows: 0, cols: 0},
  font: null,
  layers: {},
  phoxelis: null
};
const session: any = {};

function initializeSession(fontName: string, size: {rows: number, cols: number}) {
  // initialize doc and session...
}

//////////////////////////////////////////////////////////////////////////////////////
// MARK: DocumentLayers.ts
//////////////////////////////////////////////////////////////////////////////////////
// import { doc, session } = '/session';

const layerPreviewStyle = `height: 100%; width: 100%; object-fit: contain;`;
let documentLayers: Record<string, DocumentLayer> = {};

type DocumentLayer = {
  layerId: string;
  name: string;
  target: HTMLCanvasElement;
  opacity: number;
  visible: boolean;
};

function createDocumentLayer(layerId?: string) {
  const target = document.createElement('canvas');
  target.width = doc.font.width * doc.size.cols;
  target.height = doc.font.height * doc.size.rows;
  target.style = layerPreviewStyle;

  const lid = layerId ?? doc.phoxelis.addLayer();

  doc.layers[lid] = {
    layerId: lid,
    name: `Layer #${doc.phoxelis.layers.length}`,
    target,
    opacity: 100,
    visible: true,
  };

  // createLayerElement(doc.layers[lid]);
  // renderLayerList();
  selectLayer(lid);
}

function removeDocumentLayer(layerId: string) {
  if (doc.phoxelis.layers.length === 1) {
    console.warn("removeDocumentLayer error: You can't remove the base layer.");
    return;
  }

  const layerPosition = doc.phoxelis.layerPositions[layerId];
  doc.phoxelis.removeLayer(layerId);
  // layerList.removeChild(layerList.querySelector(`#layer-${layerId}`)!);
  delete doc.layers[layerId];
  // renderLayerList();

  const newSelectPos = Math.max(0, Math.min(doc.phoxelis.layers.length - 1, layerPosition));
  const layerBeforeId = doc.phoxelis.layers[newSelectPos].id;
  selectLayer(layerBeforeId);
}

function selectLayer(layerId: string) {
  // const layerRow = layerList.querySelector(`#layer-${layerId}`);
  // if (!layerRow) {
  //   console.error(`selectLayer error: Could not find layer by id ${layerId}`);
  //   return;
  // }
  // layerList
  //   .querySelectorAll('.layer-row')
  //   .forEach((el) => ((el as HTMLDivElement).style.background = '#2a2a2a'));
  session.activeLayer = layerId;
  // (layerRow as HTMLDivElement).style.background = '#7a7a7a';
}

createDocumentLayer(doc.phoxelis.layers[0].id);
selectLayer(doc.phoxelis.layers[0].id);
