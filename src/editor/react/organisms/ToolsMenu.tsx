import styled from 'styled-components';
import { SideButton } from '../atoms/SideButton';
import { useAppContext } from '../App';
import { toolDefs } from '../../../workspace/modules/Toolbox';
import { useValue } from '@legendapp/state/react';

export function ToolsMenu() {
  const { ws } = useAppContext();
  const currentTool = useValue(ws.state$.tool);
  const mirrorEnabled = useValue(ws.state$.mirrorEnabled);

  return (
    <Container>
      {toolDefs.map((t) => (
        <SideButton
          active={currentTool === t.name}
          key={t.name}
          title={t.tooltip}
          onClick={() => {
            ws.toolbox.setTool(t.name);
          }}
        >
          {t.icon}
        </SideButton>
      ))}
      <Divider />
      <SideButton
        active={mirrorEnabled}
        title="Mirror (toggle)"
        onClick={() => {
          ws.state$.mirrorEnabled.set(!mirrorEnabled);
        }}
      >
        ⧉
      </SideButton>
    </Container>
  );
}

const Divider = styled.div`
  width: 28px;
  height: 1px;
  background: #555;
  margin: 4px 0;
`;

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
