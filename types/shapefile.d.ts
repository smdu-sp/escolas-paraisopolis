declare module 'shapefile' {
  import type { GeoJsonGeometry } from './geojson'

  export interface ShapefileFeature {
    geometry: GeoJsonGeometry
    properties: Record<string, unknown>
  }

  export interface ShapefileSource {
    read(): Promise<{ done: boolean; value?: ShapefileFeature }>
  }

  export function open(shp: string, dbf?: string): Promise<ShapefileSource>
}
