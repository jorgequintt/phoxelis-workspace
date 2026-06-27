import iro from '@jaames/iro';
import type { Workspace } from '../Workspace';

const baseButtonStyle = `
  display: flex;
  border-radius: 7px;
  border-width: 1.5px;
  flex: 1;`
const buttonStyle = `
  ${baseButtonStyle} 
  color: black;
  text-shadow: 
    -1px -1px 0 #FFF,  
     1px -1px 0 #FFF,
    -1px  1px 0 #FFF,
     1px  1px 0 #FFF;
  border-color: #FFF;
`;
const buttonActivStyle = `
  ${baseButtonStyle} 
  color: white;
  text-shadow: 
    -1px -1px 0 #000,  
     1px -1px 0 #000,
    -1px  1px 0 #000,
     1px  1px 0 #000;
  border-color: #000;
`;

export function createColorPicker(ws: Workspace) {
  const colorPickerEl = document.createElement('div');
  colorPickerEl.style.cssText = `
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
  `;

  const colorPickerContainer = document.createElement('div');
  colorPickerContainer.id = '#colorpicker';
  const colorPicker = iro.ColorPicker(colorPickerContainer, {
    width: 150,
    layout: [
      {
        component: iro.ui.Wheel,
      },
      {
        component: iro.ui.Slider,
      },
    ],
    layoutDirection: 'horizontal',
  });

  const handleColorPickerChange = (color: { hexString: string }) => {
    const selectedColorType = ws.state$.selectedColorType.get();
    ws.state$.dp[selectedColorType].set(color.hexString);
  };

  function renderButtons(){
    const type = ws.state$.selectedColorType.get();
    fgColorButton.style.cssText = type === 'fg' ? buttonActivStyle : buttonStyle;
    bgColorButton.style.cssText = type === 'bg' ? buttonActivStyle : buttonStyle;
    fgColorButton.style.backgroundColor = ws.state$.dp.fg.get();
    fgColorButton.style.alignItems = 'end';
    bgColorButton.style.backgroundColor = ws.state$.dp.bg.get();
    bgColorButton.style.alignItems = 'end';
  }

  const selectColorType = (type: 'fg' | 'bg') => {
    ws.state$.selectedColorType.set(type);
    const color = ws.state$.dp[type].get();
    colorPicker.color.hexString = color;
    renderButtons();
  };

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.6em 0px;
  `;
  const fgColorButton = document.createElement('button');
  fgColorButton.innerHTML = 'Foreground';
  fgColorButton.addEventListener('click', () => selectColorType('fg'));
  const bgColorButton = document.createElement('button');
  bgColorButton.innerHTML = 'Background';
  bgColorButton.addEventListener('click', () => selectColorType('bg'));
  renderButtons();
  
  buttonsContainer.append(fgColorButton);
  buttonsContainer.append(bgColorButton);
  colorPickerEl.appendChild(buttonsContainer);
  colorPickerEl.appendChild(colorPickerContainer);

  
  colorPicker.on('color:change', handleColorPickerChange);
  
  ws.state$.dp.onChange(() => {
    renderButtons();
  });
  
  selectColorType('fg');
  
  const dispose = () => {
    colorPicker.off('color:change', handleColorPickerChange);
    colorPickerEl.remove();
  };

  return { picker: colorPicker, element: colorPickerEl, dispose };
}
