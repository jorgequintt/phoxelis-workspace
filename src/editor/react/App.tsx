import { createContext, useContext } from 'react';
import type { Workspace } from '../../workspace/Workspace';
import type { Editor } from '../Editor';
import LayersPanel from './LayersPanel';

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
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <LayersPanel />
      </div>
    </AppContext.Provider>
  );
}
