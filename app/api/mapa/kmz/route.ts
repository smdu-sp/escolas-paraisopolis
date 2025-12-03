import { NextRequest } from 'next/server'
import { open } from 'shapefile'
import proj4 from 'proj4'
import fs from 'fs'
import path from 'path'
import tokml from 'tokml'
import JSZip from 'jszip'

export const runtime = 'nodejs'

function transformCoordinates(coords: any, transform: (c: [number, number]) => [number, number]): any {
  if (!Array.isArray(coords)) return coords
  if (coords.length === 0) return coords
  if (typeof coords[0] === 'number') {
    const [x, y] = coords as [number, number]
    return transform([x, y])
  }
  return coords.map((c) => transformCoordinates(c, transform))
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileParam = url.searchParams.get('file')
    if (!fileParam) {
      return new Response('file param required', { status: 400 })
    }

    const safeBase = fileParam.replace(/\\/g, '').replace(/\//g, '')
    const baseDir = path.join(process.cwd(), 'public', 'mapa')
    const shpPath = path.join(baseDir, `${safeBase}.shp`)
    const dbfPath = path.join(baseDir, `${safeBase}.dbf`)
    const prjPath = path.join(baseDir, `${safeBase}.prj`)

    if (!fs.existsSync(shpPath) || !fs.existsSync(dbfPath)) {
      return new Response('shapefile not found', { status: 404 })
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
    const features: any[] = []
    while (true) {
      const result = await source.read()
      if (result.done) break
      const val: any = result.value
      const geom = val.geometry
      const transformed = {
        type: geom.type,
        coordinates: transformCoordinates(geom.coordinates, transform),
      }
      features.push({ type: 'Feature', properties: val.properties, geometry: transformed })
    }

    const fc = { type: 'FeatureCollection', features }
    const kml = tokml(fc, { simplestyle: true })

    const zip = new JSZip()
    zip.file('doc.kml', kml)
    const kmz = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

    return new Response(kmz as BodyInit, {
      headers: {
        'content-type': 'application/vnd.google-earth.kmz',
        'content-disposition': `attachment; filename="${safeBase}.kmz"`
      }
    })
  } catch (e) {
    return new Response('failed to convert shapefile', { status: 500 })
  }
}