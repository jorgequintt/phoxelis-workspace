import iro from '@jaames/iro';
import type { Workspace } from '../Workspace';

export function createColorPicker(ws: Workspace) {
  const colorPickerEl = document.createElement('div');
  colorPickerEl.id = '#colorpicker';
  const colorPicker = iro.ColorPicker(colorPickerEl, {
    width: 150,
    layout: [
      {
        component: iro.ui.Wheel,
      },
      {
        component: iro.ui.Slider,
      },
    ],
  });

  const handleColorPickeChange = (color: any) => {
    ws.state.dp[ws.state.selectedColorType] = color.hexString;

    if (ws.state.paletteData.modifyingPhox && ws.state.paletteData.selectedPhox > 0) {
      const selectedPalettePhox = ws.phoxelis.getPhoxFromPaletteIndex(
        ws.state.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        ws.phoxelis.storePhoxInPalette(ws.state.paletteData.selectedPhox, {
          char: selectedPalettePhox.char,
          fg:
            ws.state.selectedColorType === 'fg'
              ? ws.state.dp[ws.state.selectedColorType]
              : selectedPalettePhox.fg,
          bg:
            ws.state.selectedColorType === 'bg'
              ? ws.state.dp[ws.state.selectedColorType]
              : selectedPalettePhox.bg,
        });
      }
    }
  };
  colorPicker.on('color:change', handleColorPickeChange);

  const selectColorType = (type: 'fg' | 'bg') => {
    ws.state.selectedColorType = type;
    colorPicker.color.hexString = ws.state.dp[type];
  }

  const fgColorButton = document.createElement('button');
  fgColorButton.innerHTML = 'Foreground';
  fgColorButton.addEventListener('click', () => selectColorType('fg'));
  colorPickerEl.append(fgColorButton);
  const bgColorButton = document.createElement('button');
  bgColorButton.innerHTML = 'Background';
  bgColorButton.addEventListener('click', () => selectColorType('bg'));
  colorPickerEl.append(bgColorButton);

  selectColorType('fg');

  const dispose = () => {
    colorPicker.off('color:change', handleColorPickeChange);
    colorPickerEl.remove();
  };

  return { picker: colorPicker, el: colorPickerEl, dispose };
}
