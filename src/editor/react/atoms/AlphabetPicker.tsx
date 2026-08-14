import { useEffect, useRef } from 'react';
import type { CharShape } from 'phoxelis';
import styled from 'styled-components';
import { useAppContext } from '../App';

const alphabetWidth = 320;
const containerHeight = 200;
const margin = 1;
const viewScale = 2;

interface Props {
  onChange: (chars: string[]) => void;
}

export function AlphabetPicker({ onChange }: Props) {
  const { ws } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedRef = useRef<string[]>([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const font = ws.font;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const cellWidth = font.width + margin;
    const cellHeight = font.height + margin;
    const cols = Math.ceil(alphabetWidth / cellWidth);
    const rows = Math.ceil(font.length / cols);
    canvas.width = cols * cellWidth;
    canvas.height = rows * cellHeight;

    const drawChar = (index: number, shape: CharShape, fg: string, bg: string) => {
      const yOffset = Math.floor(index / cols) * cellHeight;
      const xOffset = (index % cols) * cellWidth;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
          ctx.fillStyle = shape[y][x] ? fg : bg;
          ctx.fillRect(xOffset + x, yOffset + y, 1, 1);
        }
      }
    };

    const redraw = () => {
      font.charactersList.forEach((char, i) => {
        const ch = String.fromCodePoint(char.codepoint);
        const isSelected = selectedRef.current.includes(ch);
        drawChar(
          i,
          char.shape,
          isSelected ? '#000000' : '#FFFFFF',
          isSelected ? '#00FFFF' : '#000000',
        );
      });
    };

    redraw();

    const handleClick = (e: MouseEvent) => {
      const r = Math.floor(e.offsetY / viewScale / cellHeight);
      const c = Math.floor(e.offsetX / viewScale / cellWidth);
      const index = r * cols + c;
      const char = font.charactersList[index];
      if (!char) return;
      const ch = String.fromCodePoint(char.codepoint);
      const idx = selectedRef.current.indexOf(ch);
      if (idx >= 0) {
        selectedRef.current.splice(idx, 1);
      } else {
        selectedRef.current.push(ch);
      }
      redraw();
      onChangeRef.current([...selectedRef.current]);
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [ws]);

  return (
    <Container>
      <Canvas
        ref={canvasRef}
        style={{
          width: alphabetWidth * viewScale,
          imageRendering: 'pixelated',
        }}
      />
    </Container>
  );
}

const Container = styled.div`
  height: ${containerHeight}px;
  overflow-y: scroll;
  border: 1px solid #444;
`;

const Canvas = styled.canvas`
  display: block;
`;
