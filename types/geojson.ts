export type GeoJsonCoordinates = number[] | GeoJsonCoordinates[]

export interface GeoJsonGeometry {
  type: string
  coordinates?: GeoJsonCoordinates
  geometries?: GeoJsonGeometry[]
}

export interface GeoJsonFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: GeoJsonGeometry
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}
