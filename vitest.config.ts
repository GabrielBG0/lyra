import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/stores/**'],
      exclude: ['src/lib/tauri.ts', 'src/lib/tourSteps.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: 'qa-output/typescript/coverage',
    },
  },
})
