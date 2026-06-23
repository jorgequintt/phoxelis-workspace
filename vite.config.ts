import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [reactPlugin(), svelte()]
});