import { Button, Group, Select, Stack } from '@mantine/core';
import { closeAllModals } from '@mantine/modals';
import { useState } from 'react';

const SCALE_OPTIONS = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '4', label: '4x' },
  { value: '8', label: '8x' },
];

export function ExportModal(props: { onSubmit: (scale: number) => void }) {
  const [scale, setScale] = useState('1');

  const submit = () => {
    props.onSubmit(Number(scale));
    closeAllModals();
  };

  return (
    <Stack>
      <Select
        label="Scale"
        data={SCALE_OPTIONS}
        value={scale}
        onChange={(v) => v && setScale(v)}
        data-autofocus
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={() => closeAllModals()}>
          Cancel
        </Button>
        <Button onClick={submit}>Export</Button>
      </Group>
    </Stack>
  );
}