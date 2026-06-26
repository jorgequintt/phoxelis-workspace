import styled from 'styled-components';
import { drawModeDefs } from '../../../workspace/modules/DrawManager';
import { SideButton } from '../atoms/SideButton';
import { useAppContext } from '../App';
import { useValue } from '@legendapp/state/react';

export function DrawModeMenu() {
  const { ws } = useAppContext();
  const currentDrawMode = useValue(ws.state$.drawMode);

  return (
    <Container>
      {drawModeDefs.map((dm) => (
        <SideButton
          active={dm.name === currentDrawMode}
          key={dm.name}
          title={dm.tooltip}
          onClick={() => {
            ws.state$.drawMode.set(dm.name);
          }}
        >
          {dm.icon}
        </SideButton>
      ))}
    </Container>
  );
}

const Container = styled.div`
  width: 40px;
  flex-shrink: 0;
  background: #2a2a2a;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
`;
