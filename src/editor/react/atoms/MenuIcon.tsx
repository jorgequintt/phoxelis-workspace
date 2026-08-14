import type { ReactElement } from 'react';
import { PencilIcon } from '@phosphor-icons/react/dist/csr/Pencil';
import { SelectionIcon } from '@phosphor-icons/react/dist/csr/Selection';
import { SquareIcon } from '@phosphor-icons/react/dist/csr/Square';
import { LineSegmentIcon } from '@phosphor-icons/react/dist/csr/LineSegment';
import { CircleIcon } from '@phosphor-icons/react/dist/csr/Circle';
import { CircleHalfIcon } from '@phosphor-icons/react/dist/csr/CircleHalf';
import { TextTIcon } from '@phosphor-icons/react/dist/csr/TextT';
import { TextAaIcon } from '@phosphor-icons/react/dist/csr/TextAa';
import { EraserIcon } from '@phosphor-icons/react/dist/csr/Eraser';
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play';
import { ColumnsIcon } from '@phosphor-icons/react/dist/csr/Columns';

const iconSize = 20;

const icons: Record<string, ReactElement> = {
  selection: <SelectionIcon size={iconSize} />,
  pencil: <PencilIcon size={iconSize} />,
  square: <SquareIcon size={iconSize} />,
  squareFill: <SquareIcon size={iconSize} weight="fill" />,
  lineSegment: <LineSegmentIcon size={iconSize} />,
  circle: <CircleIcon size={iconSize} />,
  circleFill: <CircleIcon size={iconSize} weight="fill" />,
  circleHalf: <CircleHalfIcon size={iconSize} />,
  textT: <TextTIcon size={iconSize} />,
  textAa: <TextAaIcon size={iconSize} />,
  eraser: <EraserIcon size={iconSize} />,
  play: <PlayIcon size={iconSize} />,
  columns: <ColumnsIcon size={iconSize} />,
};

export function MenuIcon({ name }: { name: string }) {
  return icons[name] ?? null;
}