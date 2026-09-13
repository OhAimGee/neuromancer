/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    // Les spritesheets doivent rester des fichiers : une spritesheet inlinee en
    // base64 ne peut pas etre chargee par l'Assets API de Pixi.
    assetsInlineLimit: 0,
    target: 'es2022',
  },
  server: {
    port: 5173,
    // Le projet vit sur /mnt/c (systeme de fichiers Windows monte dans WSL) ;
    // les evenements inotify n'y remontent pas de facon fiable.
    watch: { usePolling: true, interval: 300 },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
