import styled from 'styled-components';
import { DOMWrapper } from '../atoms/DOMWrapper';
import { useAppContext } from '../App';
import LayersPanel from '../organisms/LayersPanel';
import VersioningPanel from '../organisms/VersioningPanel';

export const sidebarWidth = 150;

export function Sidebar() {
  const { ws } = useAppContext();

  return (
    <Container>
      <DOMWrapper el={ws.alphabet.element} />
      <DOMWrapper el={ws.colorPicker.element} />
      <LayersPanel />
      <VersioningPanel />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
