import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy and transform manifest
    {
      name: 'copy-manifest',
      buildEnd() {
        // Read the appropriate manifest
        const manifestPath = process.env.NODE_ENV === 'production' 
          ? './manifest.prod.json' 
          : './manifest.dev.json';
        
        if (fs.existsSync(manifestPath)) {
          // Read the manifest
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          
          // Write it to the output directory
          if (!fs.existsSync('./dist')) {
            fs.mkdirSync('./dist', { recursive: true });
          }
          fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifest, null, 2));
          console.log(`Copied ${manifestPath} to ./dist/manifest.json`);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clean the output directory before building
    sourcemap: true,   // Generate sourcemaps for debugging
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/pages/popup/index.html'),
        // Add other entry points as needed:
        // options: resolve(__dirname, 'src/pages/options/index.html'),
        // background: resolve(__dirname, 'src/background/index.ts'),

        background: resolve(__dirname, 'src/extension-scripts/background.ts'),
        'content-script': resolve(__dirname, 'src/extension-scripts/content-script.ts'),
      },
      output: {
        inlineDynamicImports: false,
        entryFileNames: (chunkInfo) => {
          if (['background', 'content-script'].includes(chunkInfo.name)) {
            return `extension-scripts/[name].js`;
          }
          return '[name]/index.js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'es',
      }
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});