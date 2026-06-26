import styled from 'styled-components';
import { DOMWrapper } from '../atoms/DOMWrapper';
import { useAppContext } from '../App';

export function Footer() {
  const { ws } = useAppContext();

  return (
    <Container>
      <DOMWrapper el={ws.palette} />
    </Container>
  );
}

const Container = styled.div`
  overflow-x: scroll;
`;
