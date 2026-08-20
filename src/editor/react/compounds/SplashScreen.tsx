import { Button, Text } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { FilePlusIcon } from '@phosphor-icons/react/dist/csr/FilePlus';
import { FolderOpenIcon } from '@phosphor-icons/react/dist/csr/FolderOpen';
import { QuestionMarkIcon } from '@phosphor-icons/react/dist/csr/QuestionMark';
import styled from 'styled-components';
import { useAppContext } from '../App';
import { NewDocumentModal } from './NewDocumentModal';
import { StartModal } from './StartModal';

export function openSplashScreen() {
  openModal({
    size: 700,
    padding: 0,
    centered: true,
    withCloseButton: false,
    children: <SplashScreen />,
  });
}

export function SplashScreen() {
  const { ed } = useAppContext();

  return (
    <SplashContainer>
      <SplashContent>
        <Text size="xl" fw={700}>
          Phoebis
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          Version {__APP_VERSION__}
        </Text>
        <Text size="sm" c="dimmed" mb="xl">
          A browser-based phoxel/ASCII art editor.
        </Text>
        <OptionsStack>
          <Button
            leftSection={<FilePlusIcon size={20} />}
            justify="flex-start"
            variant="default"
            onClick={() => {
              closeAllModals();
              openModal({
                title: 'New Document',
                children: <NewDocumentModal />,
              });
            }}
          >
            Create new document
          </Button>
          <Button
            leftSection={<FolderOpenIcon size={20} />}
            justify="flex-start"
            variant="default"
            onClick={() => {
              closeAllModals();
              ed.loadDocumentCommand();
            }}
          >
            Load document
          </Button>
          <Button
            leftSection={<QuestionMarkIcon size={20} />}
            justify="flex-start"
            variant="default"
            onClick={() => {
              closeAllModals();
              openModal({
                title: 'Start',
                children: <StartModal />,
              });
            }}
          >
            How to use
          </Button>
        </OptionsStack>
      </SplashContent>
      <SplashArt />
    </SplashContainer>
  );
}

const SplashContainer = styled.div`
  display: flex;
  min-height: 360px;
`;

const SplashContent = styled.div`
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const OptionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 280px;
`;

// Reserved blank panel for a future background image.
const SplashArt = styled.div`
  width: 280px;
`;