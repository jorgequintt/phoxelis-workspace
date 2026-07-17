import { Button, Group, NumberInput, Select, Stack } from '@mantine/core';
import { closeAllModals } from '@mantine/modals';
import { type FontName } from 'phoxelis';
import { useAppContext } from '../App';
import { useState } from 'react';

const FONT_NAMES: FontName[] = [
  '0_Trithemius437',
  '1_Trithemius8x16',
  '2_Trithemius9x15',
  '3_Trithemius6x9',
  '4_Trithemius5x8',
];

export function NewDocumentModal() {
  const { ed } = useAppContext();
  const [rows, setRows] = useState(37);
  const [cols, setCols] = useState(152);
  const [fontName, setFontName] = useState<FontName>('1_Trithemius8x16');

  return (
    <Stack>
      <NumberInput
        label="Rows"
        value={rows}
        onChange={(v) => setRows(Number(v))}
        min={1}
        allowDecimal={false}
        allowNegative={false}
      />
      <NumberInput
        label="Cols"
        value={cols}
        onChange={(v) => setCols(Number(v))}
        min={1}
        allowDecimal={false}
        allowNegative={false}
      />
      <Select
        label="Font"
        data={FONT_NAMES}
        value={fontName}
        onChange={(v) => v && setFontName(v as FontName)}
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={() => closeAllModals()}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            closeAllModals();
            ed.startSession({ size: { rows, cols }, fontName });
          }}
        >
          Create
        </Button>
      </Group>
    </Stack>
  );
}
