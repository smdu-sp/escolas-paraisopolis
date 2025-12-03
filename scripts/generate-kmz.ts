import fs from 'fs'
import path from 'path'
import * as shapefile from 'shapefile'
import proj4 from 'proj4'
import tokml from 'tokml'
import JSZip from 'jszip'

function transformCoordinates(coords: any, transform: (c: [number, number]) => [number, number]): any {
  if (!Array.isArray(coords)) return coords
  if (coords.length === 0) return coords
  if (typeof coords[0] === 'number') {
    const [x, y] = coords as [number, number]
    return transform([x, y])
  }
  return coords.map((c) => transformCoordinates(c, transform))
}

async function convertOne(baseDir: string, baseName: string, outDir: string) {
  const shpPath = path.join(baseDir, `${baseName}.shp`)
  const dbfPath = path.join(baseDir, `${baseName}.dbf`)
  const prjPath = path.join(baseDir, `${baseName}.prj`)
  const cpgPath = path.join(baseDir, `${baseName}.cpg`)

  if (!fs.existsSync(shpPath) || !fs.existsSync(dbfPath)) return

  let sourceProj = 'WGS84'
  if (fs.existsSync(prjPath)) {
    const wkt = fs.readFileSync(prjPath, 'utf8')
    if (wkt.includes('SIRGAS_2000_UTM_Zone_23S')) {
      proj4.defs('EPSG:31983', '+proj=utm +zone=23 +south +ellps=GRS80 +units=m +no_defs')
      sourceProj = 'EPSG:31983'
    }
  }

  const transform = (c: [number, number]) => (sourceProj === 'WGS84' ? c : proj4(sourceProj, 'WGS84', c))

  const encoding = fs.existsSync(cpgPath) ? fs.readFileSync(cpgPath, 'utf8').trim() : undefined
  const options = encoding ? { encoding } : undefined
  const source = await (shapefile as any).open(shpPath, dbfPath, options)
  const features: any[] = []
  while (true) {
    const result = await source.read()
    if (result.done) break
    const val: any = result.value
    const geom = val.geometry
    let props: any = { ...val.properties }
    if (baseName === 'Locais_oficina') {
      const nome = props.nome || props.NOME || props.Nome
      if (nome && !props.name) props.name = nome
      if (nome && !props.description) props.description = nome
    }
    const transformed = {
      type: geom.type,
      coordinates: transformCoordinates(geom.coordinates, transform),
    }
    features.push({ type: 'Feature', properties: props, geometry: transformed })
  }

  const fc = { type: 'FeatureCollection', features }
  const kml = tokml(fc, { simplestyle: true })

  const zip = new JSZip()
  zip.file('doc.kml', kml)
  const kmz = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  const outPath = path.join(outDir, `${baseName}.kmz`)
  fs.writeFileSync(outPath, kmz)
  console.log(`KMZ gerado: ${outPath}`)

  if (baseName === 'Locais_oficina') {
    try {
      const dbf = await (shapefile as any).openDbf(dbfPath, options)
      const fields = (dbf as any)._fields || []
      const details = fields.map((f: any) => `${f.name} (${f.type}) len:${f.length}`)
      console.log(`Campos DBF ${baseName}:`)
      details.forEach((d: string) => console.log(`- ${d}`))
    } catch (e) {
      console.error(`Falha ao inspecionar DBF de ${baseName}:`, e)
    }
  }
}

async function main() {
  const baseDir = path.join(process.cwd(), 'public', 'mapa')
  const outDir = path.join(process.cwd(), 'public', 'kmz')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const entries = fs.readdirSync(baseDir)
  const bases = entries
    .filter((f) => f.toLowerCase().endsWith('.shp'))
    .map((f) => f.slice(0, -4))
  for (const base of bases) {
    try {
      await convertOne(baseDir, base, outDir)
    } catch (e) {
      console.error(`Falha ao converter ${base}:`, e)
    }
  }
}

main()