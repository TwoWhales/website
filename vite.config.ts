import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is the critical fix for GitHub Pages:
  // It forces assets to use relative paths (e.g. "./script.js") instead of absolute paths ("/")
  base: './', 
});