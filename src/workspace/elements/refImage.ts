export function createRefImage() {
  const refImage = document.createElement('img');
  refImage.alt = ''; // removes broken icon
  const refImageWrapper = document.createElement('div');
  refImageWrapper.append(refImage);
  refImageWrapper.style = `position: absolute; top: 0px; right: 0px; z-index: -999; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`;

  return { img: refImage, wrapper: refImageWrapper };
}
