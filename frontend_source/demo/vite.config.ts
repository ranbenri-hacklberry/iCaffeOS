
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 4029,
        strictPort: true,
    },
    root: '.',
    build: {
        rollupOptions: {
            input: {
                main: './zerog.html',
            },
        },
    },
});
