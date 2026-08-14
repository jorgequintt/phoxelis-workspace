import {
  ActionIcon,
  Center,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { closeAllModals, modals } from '@mantine/modals';
import { FileIcon } from '@phosphor-icons/react/dist/csr/File';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../App';

export function LoadDocumentModal(props: { onSelect: (name: string) => void }) {
  const { ed } = useAppContext();
  const [documents, setDocuments] = useState<string[] | null>(null);
  const [query, setQuery] = useState('');

  const refresh = async () => {
    setDocuments(await ed.listDocuments());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!documents) return [];
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((name) => name.toLowerCase().includes(q));
  }, [documents, query]);

  const handleSelect = (name: string) => {
    props.onSelect(name);
    closeAllModals();
  };

  const handleDelete = (name: string) => {
    modals.openConfirmModal({
      title: 'Delete document',
      children: (
        <Text size="sm">
          Are you sure you want to delete "{name}"?
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        await ed.deleteDocument(name);
        await refresh();
      },
    });
  };

  if (documents === null) {
    return (
      <Center h={120}>
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Search documents..."
        leftSection={<MagnifyingGlassIcon size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        data-autofocus
      />
      {documents.length === 0 ? (
        <Center h={80}>
          <Text size="sm" c="dimmed">
            No saved documents found.
          </Text>
        </Center>
      ) : filtered.length === 0 ? (
        <Center h={80}>
          <Text size="sm" c="dimmed">
            No documents match "{query.trim()}".
          </Text>
        </Center>
      ) : (
        <>
          <Text size="xs" c="dimmed">
            {filtered.length} {filtered.length === 1 ? 'document' : 'documents'}
          </Text>
          <ScrollArea.Autosize mah={260}>
            <Stack gap={2}>
              {filtered.map((name) => (
                <Row key={name}>
                  <RowButton onClick={() => handleSelect(name)}>
                    <FileIcon size={18} />
                    <Text size="sm" truncate>
                      {name}
                    </Text>
                  </RowButton>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    aria-label={`Delete ${name}`}
                    onClick={() => handleDelete(name)}
                  >
                    <TrashIcon size={16} />
                  </ActionIcon>
                </Row>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </>
      )}
    </Stack>
  );
}

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px 3px 8px;
  border-radius: 4px;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const RowButton = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 4px 0;
  text-align: left;

  &:hover {
    color: #fff;
  }
`;