import { createContext, useContext, useEffect } from 'react';
import '@mantine/core/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import type { Workspace } from '../../workspace/Workspace';
import type { Editor } from '../Editor';
import styled from 'styled-components';
import { NavBar } from './organisms/NavBar';
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

const theme = createTheme({
  scale: 0.95,
  spacing: {
    xs: '0.5rem',
    sm: '0.6rem',
    md: '0.7rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  radius: {
    xs: '0.0rem',
    sm: '0.1rem',
    md: '0.2rem',
    lg: '0.4rem',
    xl: '0.6rem',
  },
});

export default function App({ ws, ed }: Props) {
  useEffect(() => {
    ws.onMounted();
  });

  return (
    <AppContext.Provider value={{ ws, ed }}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <Container>
          <NavBar />
          <Content />
          <Footer />
        </Container>
      </MantineProvider>
    </AppContext.Provider>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;
