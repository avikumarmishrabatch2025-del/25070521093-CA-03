import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const monorepoPreview = {
  name: 'finpilot-monorepo-preview',
  closeBundle() {
    try {
      const clientDist = path.resolve(process.cwd(), 'dist');
      const projectRoot = path.resolve(process.cwd(), '..');
      if (!fs.existsSync(path.join(clientDist, 'index.html'))) return;
      fs.copyFileSync(path.join(clientDist, 'index.html'), path.join(projectRoot, 'index.html'));
      fs.cpSync(clientDist, path.join(projectRoot, 'dist'), { recursive: true });
    } catch {}
  }
};

export default defineConfig({
  plugins: [react(), monorepoPreview],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
