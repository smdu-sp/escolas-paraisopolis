import type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from '@/types/geojson'

type Coord = [number, number] | [number, number, number]

function escapeXml(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function coordToKml(c: Coord): string {
  return `${c[0]},${c[1]},${c[2] ?? 0}`
}

function ringToKml(ring: Coord[]): string {
  return `<LinearRing><coordinates>${ring.map(coordToKml).join(' ')}</coordinates></LinearRing>`
}

function geometryToKml(geom: GeoJsonGeometry | undefined): string {
  if (!geom) return ''
  switch (geom.type) {
    case 'Point':
      return `<Point><coordinates>${coordToKml(geom.coordinates as Coord)}</coordinates></Point>`
    case 'MultiPoint':
      return `<MultiGeometry>${(geom.coordinates as Coord[]).map((c) => `<Point><coordinates>${coordToKml(c)}</coordinates></Point>`).join('')}</MultiGeometry>`
    case 'LineString':
      return `<LineString><coordinates>${(geom.coordinates as Coord[]).map(coordToKml).join(' ')}</coordinates></LineString>`
    case 'MultiLineString':
      return `<MultiGeometry>${(geom.coordinates as Coord[][]).map((line) => `<LineString><coordinates>${line.map(coordToKml).join(' ')}</coordinates></LineString>`).join('')}</MultiGeometry>`
    case 'Polygon': {
      const [outer, ...holes] = geom.coordinates as Coord[][]
      return `<Polygon><outerBoundaryIs>${ringToKml(outer)}</outerBoundaryIs>${holes.map((h) => `<innerBoundaryIs>${ringToKml(h)}</innerBoundaryIs>`).join('')}</Polygon>`
    }
    case 'MultiPolygon':
      return `<MultiGeometry>${(geom.coordinates as unknown as Coord[][][]).map((poly) => geometryToKml({ type: 'Polygon', coordinates: poly })).join('')}</MultiGeometry>`
    case 'GeometryCollection':
      return `<MultiGeometry>${(geom.geometries ?? []).map(geometryToKml).join('')}</MultiGeometry>`
    default:
      return ''
  }
}

function hexToKmlColor(hex: string, opacity: number): string {
  const h = hex.replace('#', '').replace(/^([0-9a-f]{3})$/i, '$1$1$1$1').slice(0, 6).padEnd(6, '0')
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255).toString(16).padStart(2, '0')
  return `${a}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`
}

function styleToKml(props: Record<string, unknown>): string {
  const parts: string[] = []
  const markerColor = props['marker-color']
  if (markerColor) {
    parts.push(`<IconStyle><color>${hexToKmlColor(String(markerColor), 1)}</color></IconStyle>`)
  }
  const stroke = props['stroke'] as string | undefined
  const strokeOpacity = (props['stroke-opacity'] as number | undefined) ?? 1
  const strokeWidth = (props['stroke-width'] as number | undefined) ?? 2
  if (stroke || strokeWidth !== 2) {
    parts.push(`<LineStyle><color>${hexToKmlColor(stroke ?? '#555555', strokeOpacity)}</color><width>${strokeWidth}</width></LineStyle>`)
  }
  const fill = props['fill'] as string | undefined
  const fillOpacity = (props['fill-opacity'] as number | undefined) ?? 0.5
  if (fill) {
    parts.push(`<PolyStyle><color>${hexToKmlColor(fill, fillOpacity)}</color></PolyStyle>`)
  }
  return parts.length ? `<Style>${parts.join('')}</Style>` : ''
}

function featureToKml(feature: GeoJsonFeature, simplestyle: boolean): string {
  const props = feature.properties ?? {}
  const name = (props.name ?? props.Name ?? props.NAME ?? '') as string
  const description = (props.description ?? props.Description ?? '') as string
  const geomKml = geometryToKml(feature.geometry)
  if (!geomKml) return ''
  return [
    '<Placemark>',
    name ? `<name>${escapeXml(name)}</name>` : '',
    description ? `<description>${escapeXml(description)}</description>` : '',
    simplestyle ? styleToKml(props) : '',
    geomKml,
    '</Placemark>',
  ].filter(Boolean).join('')
}

export function geojsonToKml(geojson: GeoJsonFeatureCollection | GeoJsonFeature | GeoJsonGeometry, opts: { simplestyle?: boolean } = {}): string {
  const { simplestyle = false } = opts
  let placemarks: string[]
  if ('features' in geojson) {
    placemarks = geojson.features.map((f) => featureToKml(f, simplestyle))
  } else if ('geometry' in geojson) {
    placemarks = [featureToKml(geojson, simplestyle)]
  } else {
    const g = geometryToKml(geojson)
    placemarks = g ? [`<Placemark>${g}</Placemark>`] : []
  }
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks.join('')}</Document></kml>`
}
