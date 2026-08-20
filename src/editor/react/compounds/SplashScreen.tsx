import { Anchor, Button, Text } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { FilePlusIcon } from '@phosphor-icons/react/dist/csr/FilePlus';
import { FolderOpenIcon } from '@phosphor-icons/react/dist/csr/FolderOpen';
import { QuestionMarkIcon } from '@phosphor-icons/react/dist/csr/QuestionMark';
import styled from 'styled-components';
import { useAppContext } from '../App';
import { NewDocumentModal } from './NewDocumentModal';
import { StartModal } from './StartModal';
import elizaImage from '../../../assets/eliza.png';
import lampImage from '../../../assets/lamp.png';
import roseImage from '../../../assets/rose.png';

interface SplashArt {
  image: string;
  name: string;
  href: string;
  background: string;
  backgroundSize: string;
  backgroundPosition: string;
}

// Per-image framing: tweak `backgroundSize` (e.g. '100%', 'cover', 'contain',
// '120% auto') and `backgroundPosition` (e.g. 'center', '50% 30%') to position
// each image. `background` is the container color shown around the image.
// Scaling down below 100% reveals the whole image instead of cutting it.
const SPLASH_ARTS: SplashArt[] = [
  {
    image: roseImage,
    name: 'Rose',
    href: 'https://www.behance.net/gallery/132072831/longing',
    background: '#000000',
    backgroundSize: '90%',
    backgroundPosition: '120px 50%',
  },
  {
    image: elizaImage,
    name: 'Eliza',
    href: 'https://www.behance.net/gallery/254244873/Eliza',
    background: '#000000',
    backgroundSize: '100%',
    backgroundPosition: '152px 50%',
  },
];

export function openSplashScreen() {
  const art = SPLASH_ARTS[Math.floor(Math.random() * SPLASH_ARTS.length)];
  openModal({
    size: 700,
    padding: 0,
    centered: true,
    withCloseButton: false,
    children: <SplashScreen art={art} />,
  });
}

export function SplashScreen({ art }: { art: SplashArt }) {
  const { ed } = useAppContext();

  return (
    <SplashContainer art={art}>
      <ContentPanel>
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
      </ContentPanel>
      <SplashCaption>
        <Text size="sm">{art.name}</Text>
        <Anchor
          href={art.href}
          target="_blank"
          rel="noreferrer"
          size="sm"
          c="blue.3"
        >
          View in portfolio
          <ArrowUpRightIcon size={14} />
        </Anchor>
      </SplashCaption>
    </SplashContainer>
  );
}

const SplashContainer = styled.div<{ art: SplashArt }>`
  position: relative;
  min-height: 360px;
  overflow: hidden;
  background-color: ${(props) => props.art.background};
  background-image: url(${(props) => props.art.image});
  background-size: ${(props) => props.art.backgroundSize};
  background-position: ${(props) => props.art.backgroundPosition};
  background-repeat: no-repeat;
`;

const ContentPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 55%;
  min-width: 320px;
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

const SplashCaption = styled.div`
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
`;