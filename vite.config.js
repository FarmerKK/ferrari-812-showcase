import { defineConfig } from 'vite';
export default defineConfig({
  server: {watch: {ignored: ['**/output/**','**/.playwright-cli/**','**/qa/**','**/docs/**','**/public/models/**']}},
  build: {rollupOptions: {output: {manualChunks: {three: ['three'],animation:['gsap']}}}}
});
