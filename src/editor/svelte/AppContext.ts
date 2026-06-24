import { createContext } from 'svelte';
import type { Workspace } from '../../workspace/Workspace';
import type { Editor } from '../Editor';

interface AppContext {
  ws: Workspace;
  ed: Editor;
}

export const [getAppContext, setAppContext] = createContext<AppContext>();
