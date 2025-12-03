import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'kmz')
  if (!fs.existsSync(dir))
    return new Response(JSON.stringify([]), { headers: { 'content-type': 'application/json' }})
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.kmz'))
  const urls = files.map(f => `/kmz/${encodeURIComponent(f)}`)
  return new Response(JSON.stringify(urls), { headers: { 'content-type': 'application/json' }})
}