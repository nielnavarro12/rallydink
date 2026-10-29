import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // relative asset paths: works on GitHub Pages under /repo-name/ and on any other host
  server: { host: true }, // reachable from other devices on your Wi-Fi
});
