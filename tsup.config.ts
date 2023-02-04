import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: ['cli.ts'],
  outDir: '.',
  target: 'node16',
  bundle: true,
}))
