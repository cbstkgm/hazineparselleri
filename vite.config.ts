import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function publicCsvListPlugin() {
  const virtualModuleId = 'virtual:csv-files'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-public-csv-list',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const publicDir = path.resolve(process.cwd(), 'public')
        let files: string[] = []
        if (fs.existsSync(publicDir)) {
          files = fs.readdirSync(publicDir).filter(f => f.endsWith('.csv'))
        }
        return `export const csvFiles = ${JSON.stringify(files)};`
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), publicCsvListPlugin()],
  server: {
    proxy: {
      '/tkgm-wms': {
        target: 'https://cbsservis.tkgm.gov.tr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tkgm-wms/, '/tkgm.ows/wms'),
        auth: 'genelsunum:CbsSube+13579',
        secure: false,
      }
    }
  }
})
