import iro from '@jaames/iro';
import type { Workspace } from '../Workspace';

export function createColorPicker(this: Workspace) {
  const { session, phoxelis } = this;

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

  const fgColorButton = document.createElement('button');
  fgColorButton.innerHTML = 'Foreground';
  fgColorButton.addEventListener('click', () => this.selectColorType('fg'));
  colorPickerEl.append(fgColorButton);
  const bgColorButton = document.createElement('button');
  bgColorButton.innerHTML = 'Background';
  bgColorButton.addEventListener('click', () => this.selectColorType('bg'));
  colorPickerEl.append(bgColorButton);

  return { picker: colorPicker, el: colorPickerEl, handleColorPickeChange };
}
