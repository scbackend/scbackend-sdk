import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'scbackend-sdk', // Replace it with your extension name
  entry: ['src/index.ts', 'src/index.js'],
  target: ['esnext'],
  format: ['iife'],
  outDir: 'dist',
  banner: {
    // Replace it with your extension's metadata
    js: `// Name: Scbackend SDK
// ID: scbackendsdk
// Description: SDK for Scbackend
// By: XQYWorld
// Original: FurryR
// License: MPL-2.0
`
  },
  platform: 'browser',
  clean: true
})
