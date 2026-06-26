import iro from '@jaames/iro';
import type { Workspace } from '../Workspace';

const baseButtonStyle = `
  display: flex;
  border-radius: 4px;
  border-width: 1px;
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

  const handleColorPickeChange = (color: { hexString: string }) => {
    const dp = ws.state$.dp.get();
    const selectedColorType = ws.state$.selectedColorType.get();
    ws.state$.dp[selectedColorType].set(color.hexString);

    const el = selectedColorType === 'fg' ? fgColorButton : bgColorButton;
    el.style.backgroundColor = color.hexString;

    // TODO THis below should be somewhere else
    if (
      ws.state$.paletteData.modifyingPhox.get() &&
      ws.state$.paletteData.selectedPhox.get() > 0
    ) {
      const selectedPalettePhox = ws.phoxelis.getPhoxFromPaletteIndex(
        ws.state$.paletteData.selectedPhox.get(),
      );
      if (selectedPalettePhox) {
        ws.phoxelis.storePhoxInPalette(ws.state$.paletteData.selectedPhox.get(), {
          char: selectedPalettePhox.char,
          fg: selectedColorType === 'fg' ? dp[selectedColorType] : selectedPalettePhox.fg,
          bg: selectedColorType === 'bg' ? dp[selectedColorType] : selectedPalettePhox.bg,
        });
      }
    }
  };
  colorPicker.on('color:change', handleColorPickeChange);

  const selectColorType = (type: 'fg' | 'bg') => {
    ws.state$.selectedColorType.set(type);
    const color = ws.state$.dp[type].get();
    colorPicker.color.hexString = color;
    fgColorButton.style.cssText = type === 'fg' ? buttonActivStyle : buttonStyle;
    bgColorButton.style.cssText = type === 'bg' ? buttonActivStyle : buttonStyle;
    fgColorButton.style.backgroundColor = ws.state$.dp.fg.get();
    bgColorButton.style.backgroundColor = ws.state$.dp.bg.get();
  };

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.6em 0px;
  `;
  const fgColorButton = document.createElement('button');
  fgColorButton.style.cssText = buttonActivStyle;
  fgColorButton.style.backgroundColor = ws.state$.dp.fg.get();
  fgColorButton.innerHTML = 'Foreground';
  fgColorButton.addEventListener('click', () => selectColorType('fg'));
  
  const bgColorButton = document.createElement('button');
  bgColorButton.style.cssText = buttonStyle;
  bgColorButton.style.backgroundColor = ws.state$.dp.bg.get();
  bgColorButton.innerHTML = 'Background';
  bgColorButton.addEventListener('click', () => selectColorType('bg'));
  
  buttonsContainer.append(fgColorButton);
  buttonsContainer.append(bgColorButton);
  colorPickerEl.appendChild(buttonsContainer);

  colorPickerEl.appendChild(colorPickerContainer);

  selectColorType('fg');

  const dispose = () => {
    colorPicker.off('color:change', handleColorPickeChange);
    colorPickerEl.remove();
  };

  return { picker: colorPicker, element: colorPickerEl, dispose };
}
