import { NextRequest } from 'next/server'
import { open } from 'shapefile'
import proj4 from 'proj4'
import fs from 'fs'
import path from 'path'
import type { GeoJsonCoordinates, GeoJsonFeature } from '@/types/geojson'

export const runtime = 'nodejs'

function transformCoordinates(coords: GeoJsonCoordinates, transform: (c: [number, number]) => [number, number]): GeoJsonCoordinates {
  if (!Array.isArray(coords)) return coords
  if (coords.length === 0) return coords
  if (typeof coords[0] === 'number') {
    const [x, y] = coords as [number, number]
    return transform([x, y])
  }
  return (coords as GeoJsonCoordinates[]).map((c) => transformCoordinates(c, transform))
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileParam = url.searchParams.get('file')
    if (!fileParam) {
      return new Response(JSON.stringify({ error: 'file param required' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const safeBase = fileParam.replace(/\\/g, '').replace(/\//g, '')
    const baseDir = path.join(process.cwd(), 'public', 'mapa')
    const shpPath = path.join(baseDir, `${safeBase}.shp`)
    const dbfPath = path.join(baseDir, `${safeBase}.dbf`)
    const prjPath = path.join(baseDir, `${safeBase}.prj`)

    if (!fs.existsSync(shpPath) || !fs.existsSync(dbfPath)) {
      return new Response(JSON.stringify({ error: 'shapefile not found' }), { status: 404, headers: { 'content-type': 'application/json' } })
    }

    let sourceProj = 'WGS84'
    if (fs.existsSync(prjPath)) {
      const wkt = fs.readFileSync(prjPath, 'utf8')
      if (wkt.includes('SIRGAS_2000_UTM_Zone_23S')) {
        proj4.defs('EPSG:31983', '+proj=utm +zone=23 +south +ellps=GRS80 +units=m +no_defs')
        sourceProj = 'EPSG:31983'
      }
    }

    const transform = (c: [number, number]) => (sourceProj === 'WGS84' ? c : proj4(sourceProj, 'WGS84', c))

    const source = await open(shpPath, dbfPath)
    const features: GeoJsonFeature[] = []
    while (true) {
      const result = await source.read()
      if (result.done || !result.value) break
      const geom = result.value.geometry
      const transformed = {
        type: geom.type,
        coordinates: geom.coordinates ? transformCoordinates(geom.coordinates, transform) : geom.coordinates,
      }
      features.push({ type: 'Feature', properties: result.value.properties, geometry: transformed })
    }

    const fc = { type: 'FeatureCollection', features }
    return new Response(JSON.stringify(fc), { headers: { 'content-type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'failed to read shapefile' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}