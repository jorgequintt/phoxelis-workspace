import { Button, Group, Stack, TextInput } from '@mantine/core';
import { closeAllModals } from '@mantine/modals';
import { useState } from 'react';

export function SaveDocumentModal(props: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState('');

  const canSave = name.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    props.onSubmit(name.trim());
    closeAllModals();
  };

  return (
    <Stack>
      <TextInput
        label="Name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canSave) submit();
        }}
        data-autofocus
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={() => closeAllModals()}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!canSave}>
          Save
        </Button>
      </Group>
    </Stack>
  );
}