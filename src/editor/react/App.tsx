import { createContext, useContext } from 'react';
import type { Workspace } from '../../workspace/Workspace';
import type { Editor } from '../Editor';
import LayersPanel from './organisms/LayersPanel';
import styled from 'styled-components';
import { NavBar } from './NavBar';
import { Content } from './workspace-containers/Content';
import { Footer } from './workspace-containers/Footer';
import { Sidebar } from './workspace-containers/Sidebar';
import { DOMWrapper } from './atoms/DOMWrapper';
import { DrawModeMenu } from './organisms/DrawModeMenu';
import { ToolsMenu } from './organisms/ToolsMenu';

interface AppContextValue {
  ws: Workspace;
  ed: Editor;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

interface Props {
  ws: Workspace;
  ed: Editor;
}

export default function App({ ws, ed }: Props) {
  return (
    <AppContext.Provider value={{ ws, ed }}>
      <Container>
        <NavBar />
        <Content>
          <DrawModeMenu />
          <ToolsMenu />
          <DOMWrapper el={ws.drawboard.element} />
          <Sidebar>
            <DOMWrapper el={ws.alphabet.element} />
            <DOMWrapper el={ws.colorPicker.element}/>
            <LayersPanel />
          </Sidebar>
        </Content>
        <Footer />
      </Container>
    </AppContext.Provider>
  );
}

const Container = styled.div`
width: 100%; height: 100%; display: flex; flex-direction: column;
`;
