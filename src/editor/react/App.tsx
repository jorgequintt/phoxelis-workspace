import { createContext, useContext, useEffect } from 'react';
import type { Workspace } from '../../workspace/Workspace';
import type { Editor } from '../Editor';
import styled from 'styled-components';
import { NavBar } from './NavBar';
import { Content } from './layout/Content';
import { Footer } from './layout/Footer';

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

  return (
    <AppContext.Provider value={{ ws, ed }}>
      <Container>
        <NavBar />
        <Content />
        <Footer />
      </Container>
    </AppContext.Provider>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;
