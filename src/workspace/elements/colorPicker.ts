import iro from '@jaames/iro';
import type { Workspace } from '../Workspace';

export function createColorPicker(ws: Workspace) {
  const { session, phoxelis } = ws;

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
    session.dp[session.selectedColorType] = color.hexString;

    if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
      const selectedPalettePhox = phoxelis.getPhoxFromPaletteIndex(
        session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
          char: selectedPalettePhox.char,
          fg:
            session.selectedColorType === 'fg'
              ? session.dp[session.selectedColorType]
              : selectedPalettePhox.fg,
          bg:
            session.selectedColorType === 'bg'
              ? session.dp[session.selectedColorType]
              : selectedPalettePhox.bg,
        });
      }
    }
  };
  colorPicker.on('color:change', handleColorPickeChange);

  const selectColorType = (type: 'fg' | 'bg') => {
    ws.session.selectedColorType = type;
    colorPicker.color.hexString = ws.session.dp[type];
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
    colorPicker.off('color:change', ws.colorPicker.handleColorPickeChange);
    colorPickerEl.remove();
  };

  return { picker: colorPicker, el: colorPickerEl, handleColorPickeChange, dispose };
}
