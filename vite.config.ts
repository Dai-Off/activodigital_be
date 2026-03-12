import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        env: dotenv.config({ path: path.resolve(__dirname, '.env.test') }).parsed as any,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});