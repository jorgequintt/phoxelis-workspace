<script lang="ts">
  import type { Workspace } from '../../workspace/Workspace';
  import type { Editor } from '../Editor';
  import { setAppContext } from './AppContext';
  import LayersPanel from './Layers/LayersPanel.svelte';

  interface Props {
    ws: Workspace;
    ed: Editor;
  }

  const { ws, ed }: Props = $props();

  // svelte-ignore state_referenced_locally
  setAppContext({ ws, ed });
</script>

<div>
  <LayersPanel />
  <!-- {@render children?.()} -->
</div>

<style>
  div {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
