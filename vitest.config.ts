import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import angular from "@analogjs/vite-plugin-angular";

//we use only browser config since the lib is mostly for graphical components and hence heavily depends on the DOM

export default defineConfig({
    plugins: [
        angular()
    ],
    test: {
        setupFiles: ['./vitest.setup.ts'],
        restoreMocks: true,
        globals: true,
        environment: 'jsdom',
    },
})
