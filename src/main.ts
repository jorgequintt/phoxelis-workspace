import { getFont, Phoxelis } from 'phoxelis';
import './style.css'
import Panzoom from '@panzoom/panzoom';
import Hammer from 'hammerjs';

const panzoomConfiguration = {
  minScale: 0.15,
  maxScale: 5,
  noBind: true,
  relative: true,
  cursor: 'default',
  startX: 0,
  startY: 0,
  startScale: 1,
  excludeClass: 'panzoom-exclude'
};

let scale = panzoomConfiguration.startScale;

const font = await getFont('1_Trithemius8x16');
const phoxelis = Phoxelis(37, 152, font);
document.body.append(phoxelis.canvas);

const renderLoop = () => {
  phoxelis.renderFrame();
  window.requestAnimationFrame(renderLoop);
}
window.requestAnimationFrame(renderLoop);

phoxelis.renderPhoxel('X', '#FFFFFF', '#0000FF', 1, 2);
phoxelis.renderPhoxel('X', '#FFFFFF', '#0000FF', 2, 3);
phoxelis.renderPhoxel('X', '#FFFFFF', '#0000FF', 3, 4);

const panzoom = Panzoom(phoxelis.canvas, panzoomConfiguration);
const hammer = new Hammer(phoxelis.canvas);
hammer.get('pinch').set({ enable: true });
hammer.on('pinchstart', () => {
  scale = panzoom.getScale();
});
hammer.on('pinchmove', (e) => {
      const newZoomVal = scale * e.scale;
      panzoom.zoom(newZoomVal);
      panzoom.pan(
        (e.velocityX * 11) / panzoom.getScale(),
        (e.velocityY * 11) / panzoom.getScale()
      );
});