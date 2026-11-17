import { defineConfig } from 'vitest/config'
import path from 'path'
import fs from 'fs'

// Load .env.local into process.env for tests
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8')
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      process.env[key] = val
    }
  }
} catch {
  // Ignored if missing
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
