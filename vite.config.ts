
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Safely define process.env.API_KEY as a string constant
      // We check API_KEY first, then VITE_API_KEY as a fallback
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || '')
    }
  };
});
