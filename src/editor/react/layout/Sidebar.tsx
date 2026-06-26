import styled from 'styled-components';
import { DOMWrapper } from '../atoms/DOMWrapper';
import { useAppContext } from '../App';
import LayersPanel from '../organisms/LayersPanel';

export function Sidebar() {
  const { ws } = useAppContext();

  return (
    <Container>
      <DOMWrapper el={ws.alphabet.element} />
      <DOMWrapper el={ws.colorPicker.element} />
      <LayersPanel />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
