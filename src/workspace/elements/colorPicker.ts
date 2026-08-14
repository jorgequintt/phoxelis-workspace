import iro from '@jaames/iro';
import type { Workspace } from '../Workspace';
import { sidebarWidth } from '../../editor/react/layout/Sidebar';

const baseButtonStyle = `
  display: flex;
  border-radius: 7px;
  font-size: 12px;
  width: 50px;
  cursor: pointer;
  padding: 2px 5px;
  flex: 1;`
const buttonStyle = `
  ${baseButtonStyle} 
  color: black;
  border: 1px solid #000;
  `;
  const buttonActivStyle = `
  ${baseButtonStyle} 
  color: white;
  text-shadow: 
  -1px -1px 0 #000,  
  1px -1px 0 #000,
  -1px  1px 0 #000,
  1px  1px 0 #000;
  border: 2px solid white;
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
    width: sidebarWidth,
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

  const swapColors = () => {
    const { dp } = ws.state$;
    const fg = dp.fg.get();
    dp.fg.set(dp.bg.get());
    dp.bg.set(fg);
    selectColorType(ws.state$.selectedColorType.get());
  };

  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.6em 0px;
  `;
  const fgColorButton = document.createElement('div');
  fgColorButton.innerHTML = 'FG';
  fgColorButton.addEventListener('click', () => selectColorType('fg'));
  const bgColorButton = document.createElement('div');
  bgColorButton.innerHTML = 'BG';
  bgColorButton.addEventListener('click', () => selectColorType('bg'));
  const swapColorButton = document.createElement('div');
  swapColorButton.innerHTML = '&#8646;';
  swapColorButton.style.cssText = `
    ${baseButtonStyle}
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #888;
    font-size: 16px;
    height: 5px;
    flex: 0.2;
  `;
  swapColorButton.title = 'Swap colors';
  swapColorButton.addEventListener('click', swapColors);
  renderButtons();
  
  buttonsContainer.append(fgColorButton);
  buttonsContainer.append(swapColorButton);
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
