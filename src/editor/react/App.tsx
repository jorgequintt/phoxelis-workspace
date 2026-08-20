import { createContext, useContext, useEffect } from 'react';
import type { Workspace } from '../../workspace/Workspace';
import type { Editor } from '../Editor';
import styled from 'styled-components';
import { NavBar } from './organisms/NavBar';
import { Toolbar } from './organisms/Toolbar';
import { Content } from './layout/Content';
import { Footer } from './layout/Footer';
import { Mantine } from './Mantine';
import { openSplashScreen } from './compounds/SplashScreen';
import { isSessionActive, markSessionActive } from '../../utils/session';

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
  useEffect(() => {
    ws.onMounted();
  });

  useEffect(() => {
    if (isSessionActive()) {
      return;
    }
    markSessionActive();
    requestAnimationFrame(() => openSplashScreen());
  }, []);

  return (
    <AppContext.Provider value={{ ws, ed }}>
      <Mantine>
        <Container>
          <NavBar />
          <Toolbar />
          <Content />
          <Footer />
        </Container>
      </Mantine>
    </AppContext.Provider>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;
