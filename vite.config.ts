import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    {
      name: 'copy-pwa-assets',
      apply: 'build',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const publicDir = resolve(__dirname, 'public');
        if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

        const copyFile = (fileName: string) => {
          const rootPath = resolve(__dirname, fileName);
          const publicPath = resolve(publicDir, fileName);
          const destPath = resolve(distDir, fileName);

          // Cek di root dulu
          if (fs.existsSync(rootPath)) {
            fs.copyFileSync(rootPath, destPath);
            console.log(`✅ ${fileName} copied from ROOT to dist/`);
          } 
          // Kalau gak ada di root, cek di folder public (Vite standar)
          else if (fs.existsSync(publicPath)) {
            fs.copyFileSync(publicPath, destPath);
            console.log(`✅ ${fileName} copied from PUBLIC to dist/`);
          }
          else {
            console.error(`❌ ERROR: ${fileName} TIDAK DITEMUKAN! Pastikan ada di folder utama (sejajar index.html).`);
          }
        };

        copyFile('manifest.json');
        copyFile('sw.js');
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        chart: resolve(__dirname, 'chart.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});