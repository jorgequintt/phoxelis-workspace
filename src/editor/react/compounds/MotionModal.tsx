import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { closeAllModals } from '@mantine/modals';
import { useState } from 'react';
import { useAppContext } from '../App';
import { AlphabetPicker } from '../atoms/AlphabetPicker';

export function MotionModal() {
  const { ws } = useAppContext();
  const [name, setName] = useState('');
  const [chars, setChars] = useState<string[]>([]);

  const canCreate = name.trim().length > 0 && chars.length > 0;

  const create = () => {
    if (!canCreate) return;
    const id = crypto.randomUUID();
    ws.data$.motions[id].set({ id, name: name.trim(), chars });
    ws.state$.activeMotionId.set(id);
    closeAllModals();
  };

  return (
    <Stack>
      <TextInput
        label="Name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        data-autofocus
      />
      <AlphabetPicker onChange={setChars} />
      <Text size="sm" c="dimmed">
        Sequence: {chars.join('')}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={() => closeAllModals()}>
          Cancel
        </Button>
        <Button onClick={create} disabled={!canCreate}>
          Create
        </Button>
      </Group>
    </Stack>
  );
}
