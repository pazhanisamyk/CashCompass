import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

const dbPath = path.resolve(__dirname, 'db.json')

function mockDbPlugin() {
  return {
    name: 'mock-db-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/db') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            if (fs.existsSync(dbPath)) {
              res.end(fs.readFileSync(dbPath, 'utf-8'))
            } else {
              res.end(JSON.stringify({}))
            }
            return
          }
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: any) => {
              body += chunk
            })
            req.on('end', () => {
              fs.writeFileSync(dbPath, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            })
            return
          }
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mockDbPlugin()],
  server: {
    watch: {
      ignored: ['**/db.json'],
    },
  },
})


