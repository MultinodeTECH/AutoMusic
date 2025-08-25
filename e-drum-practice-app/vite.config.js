import { defineConfig } from 'vite';

import { resolve } from 'path';

export default defineConfig({
    root: resolve(__dirname),
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
    server: {
        watch: {
            ignored: ['**/backup/**'],
        },
    },
});