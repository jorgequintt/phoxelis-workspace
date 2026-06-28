import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    reactPlugin()
  ],
  optimizeDeps: {
    include: ['@phosphor-icons/react'],
  },
});
