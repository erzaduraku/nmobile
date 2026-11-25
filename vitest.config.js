import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    // These files use node:test and are run by `node --test` so both suites stay intact.
    exclude: ['src/features/insights/insights.test.js', 'src/features/posts/guards.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.js', 'src/main.jsx'],
    },
  },
})
