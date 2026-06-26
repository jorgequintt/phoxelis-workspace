import styled from 'styled-components';
import { DrawModeMenu } from '../organisms/DrawModeMenu';
import { ToolsMenu } from '../organisms/ToolsMenu';
import { DOMWrapper } from '../atoms/DOMWrapper';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../App';

export function Content() {
  const { ws } = useAppContext();

  return (
    <Container>
      <DrawModeMenu />
      <ToolsMenu />
      <DOMWrapper el={ws.drawboard.element} />
      <Sidebar />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
`;
