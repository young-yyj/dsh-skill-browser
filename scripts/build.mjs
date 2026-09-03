import { build } from 'esbuild'

const clientId = 'dsh-skill-browser'
const clientBanner = `window.__ModuleLoader__.load({id:${JSON.stringify(clientId)},factory:(require)=>{var module={exports:{}};var exports=module.exports;`
const clientFooter = 'return module.exports;}});'

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  packages: 'external',
  sourcemap: true,
})

await build({
  entryPoints: ['src/client/index.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
  banner: { js: clientBanner },
  footer: { js: clientFooter },
  sourcemap: true,
})
