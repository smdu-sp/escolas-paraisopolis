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

function geometryToKml(geom: any): string {
  if (!geom) return ''
  switch (geom.type) {
    case 'Point':
      return `<Point><coordinates>${coordToKml(geom.coordinates)}</coordinates></Point>`
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
      return `<MultiGeometry>${(geom.coordinates as Coord[][][]).map((poly) => geometryToKml({ type: 'Polygon', coordinates: poly })).join('')}</MultiGeometry>`
    case 'GeometryCollection':
      return `<MultiGeometry>${(geom.geometries as any[]).map(geometryToKml).join('')}</MultiGeometry>`
    default:
      return ''
  }
}

function hexToKmlColor(hex: string, opacity: number): string {
  const h = hex.replace('#', '').replace(/^([0-9a-f]{3})$/i, '$1$1$1$1').slice(0, 6).padEnd(6, '0')
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255).toString(16).padStart(2, '0')
  return `${a}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`
}

function styleToKml(props: Record<string, any>): string {
  const parts: string[] = []
  if (props['marker-color']) {
    parts.push(`<IconStyle><color>${hexToKmlColor(props['marker-color'], 1)}</color></IconStyle>`)
  }
  const stroke = props['stroke']
  const strokeOpacity = props['stroke-opacity'] ?? 1
  const strokeWidth = props['stroke-width'] ?? 2
  if (stroke || strokeWidth !== 2) {
    parts.push(`<LineStyle><color>${hexToKmlColor(stroke ?? '#555555', strokeOpacity)}</color><width>${strokeWidth}</width></LineStyle>`)
  }
  const fill = props['fill']
  const fillOpacity = props['fill-opacity'] ?? 0.5
  if (fill) {
    parts.push(`<PolyStyle><color>${hexToKmlColor(fill, fillOpacity)}</color></PolyStyle>`)
  }
  return parts.length ? `<Style>${parts.join('')}</Style>` : ''
}

function featureToKml(feature: any, simplestyle: boolean): string {
  const props: Record<string, any> = feature.properties ?? {}
  const name = props.name ?? props.Name ?? props.NAME ?? ''
  const description = props.description ?? props.Description ?? ''
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

export function geojsonToKml(geojson: any, opts: { simplestyle?: boolean } = {}): string {
  const { simplestyle = false } = opts
  let placemarks: string[]
  if (geojson.type === 'FeatureCollection') {
    placemarks = (geojson.features as any[]).map((f) => featureToKml(f, simplestyle))
  } else if (geojson.type === 'Feature') {
    placemarks = [featureToKml(geojson, simplestyle)]
  } else {
    const g = geometryToKml(geojson)
    placemarks = g ? [`<Placemark>${g}</Placemark>`] : []
  }
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks.join('')}</Document></kml>`
}
