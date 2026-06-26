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

  const handleColorPickeChange = (color: { hexString: string }) => {
    const dp = ws.state$.dp.get();
    const selectedColorType = ws.state$.selectedColorType.get();
    ws.state$.dp[selectedColorType].set(color.hexString);

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
    colorPicker.color.hexString = ws.state$.dp[type].get();
  };

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

  return { picker: colorPicker, element: colorPickerEl, dispose };
}
