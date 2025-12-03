'use client';

import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import { Style, Icon, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls, Attribution } from 'ol/control';
import 'ol/ol.css';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Minus, Sun, Moon } from 'lucide-react';
import { useTheme } from "next-themes";
import TileWMS from 'ol/source/TileWMS';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import JSZip from 'jszip';

export interface MapMarker {
  id: string;
  coordinates: [number, number] | any; // [longitude, latitude]
  type: 'school' | 'house' | 'default' | 'selected';
  title?: string;
  description?: string;
}

interface MapComponentProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  className?: string;
  markers?: MapMarker[];
  onEmptyClick?: (coordinates: [number, number]) => void;
  geojsonUrls?: string[];
  wmsLayers?: { url: string; params: Record<string, string>; serverType?: 'qgis' | 'geoserver' }[];
  kmzUrls?: string[];
  enableReferenceSelection?: boolean;
  onSelectReference?: (coordinates: [number, number]) => void;
  singleSelection?: boolean;
}

function offsetCoordinates(coordinates: [number, number]): [number, number] {
  const [lon, lat] = coordinates;
  const longitudeOffset = 0.0025;
  const latitudeOffset = 0.0000;
  return [lon + longitudeOffset, lat + latitudeOffset];
}

export default function MapComponent({ 
  center = [-46.7268192, -23.6157664],
  zoom = 15,
  className = '',
  markers = [],
  onEmptyClick,
  geojsonUrls = [],
  wmsLayers = [],
  kmzUrls = [],
  enableReferenceSelection = false,
  onSelectReference,
  singleSelection = false
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer<any> | null>(null);
  const markersLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const selectedKmzRefsRef = useRef<Set<string>>(new Set());
  const kmzLayersRef = useRef<VectorLayer<VectorSource>[]>([]);
  const lastClickedFeatureRef = useRef<Feature | null>(null);

  const createMarkerStyle = (type: MapMarker['type'], currentTheme?: string) => {
    const pins = {
      school: "/escola_pin.png",
      house: "/casa_pin.png",
      default: "/default_pin.png",
      selected: "/selected_pin.png",
    }
    return new Style({
      image: new Icon({
        src: pins[type],
        scale: 0.60,
      })
    });
  };

  // Function to create tile layer (always using OSM light theme)
  const createTileLayer = () => {
    return new TileLayer({
      source: new OSM()
    });
  };
  useEffect(() => {
    if (!mapRef.current) return;
    const style = document.createElement('style');
    style.textContent = `
      .ol-attribution-bottom-left {
        bottom: 0 !important;
        left: 0 !important;
        right: auto !important;
        top: auto !important;
        background: rgba(255, 255, 255, 0.9) !important;
        padding: 4px 6px !important;
        font-size: 10px !important;
        border-radius: 0 6px 0 0 !important;
        max-width: 60% !important;
        z-index: 5 !important;
      }
      .ol-attribution-bottom-left ul {
        margin: 0 !important;
        padding: 0 !important;
      }
      .ol-attribution-bottom-left li {
        display: inline !important;
        list-style: none !important;
      }
      @media (max-width: 768px) {
        .ol-attribution-bottom-left {
          font-size: 9px !important;
          padding: 3px 5px !important;
          max-width: 70% !important;
        }
      }
      
      /* iOS-specific fixes for Drawer height */
      .ios-drawer-fix {
        height: 80vh !important;
        max-height: 80vh !important;
        min-height: 80vh !important;
      }
      
      /* iOS Safari specific viewport fixes */
      @supports (-webkit-touch-callout: none) {
        .ios-drawer-fix {
          height: 80dvh !important;
          max-height: 80dvh !important;
          min-height: 80dvh !important;
        }
      }
      
      /* Additional iOS fixes for viewport units */
      @media screen and (max-width: 768px) and (-webkit-min-device-pixel-ratio: 2) {
        .ios-drawer-fix {
          height: calc(80 * var(--vh, 1vh)) !important;
          max-height: calc(80 * var(--vh, 1vh)) !important;
          min-height: calc(80 * var(--vh, 1vh)) !important;
        }
      }
    `;
    document.head.appendChild(style);
    const attributionControl = new Attribution({
      className: 'ol-attribution ol-attribution-bottom-left',
      target: undefined,
      collapsible: false,
    });

    const markersSource = new VectorSource();
    const markersLayer = new VectorLayer({
      source: markersSource,
    });
    markersLayerRef.current = markersLayer;
    markersLayer.setZIndex(40);

    markers.forEach((marker) => {
      const correctedCoords = marker.type === 'house' 
        ? marker.coordinates 
        : offsetCoordinates(marker.coordinates);
      
      const feature = new Feature({
        geometry: new Point(fromLonLat(correctedCoords)),
        id: marker.id,
        type: marker.type,
        title: marker.title,
        description: marker.description,
      });

      feature.setStyle(createMarkerStyle(marker.type, theme));
      markersSource.addFeature(feature);
    });

    const tileLayer = createTileLayer();
    tileLayerRef.current = tileLayer;
    tileLayer.setZIndex(0);

    const map = new Map({
      target: mapRef.current,
      controls: defaultControls({
        zoom: false,
        attribution: false,
        rotate: false
      }).extend([attributionControl]),
      layers: [
        tileLayer,
        markersLayer,
        ...(
          geojsonUrls.map((url) => {
            const source = new VectorSource({
              url,
              format: new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
            });
            const style = new Style({
              image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color: '#10b981' }),
                stroke: new Stroke({ color: '#064e3b', width: 1 })
              }),
              stroke: new Stroke({ color: '#10b981', width: 2 }),
              fill: new Fill({ color: 'rgba(16, 185, 129, 0.15)' })
            });
            const layer = new VectorLayer({ source });
            layer.setStyle(style);
            layer.setZIndex(25);
            return layer;
          })
        ),
        ...(
          wmsLayers.map((wms) => {
            const layer = new TileLayer({
              source: new TileWMS({
                url: wms.url,
                params: wms.params,
                serverType: wms.serverType || 'qgis'
              })
            });
            layer.setZIndex(5);
            return layer;
          })
        )
      ],
      view: new View({
          center: fromLonLat(center),
          zoom: zoom,
        }),
    });

    kmzLayersRef.current = [];
    kmzUrls.forEach(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const zip = await new JSZip().loadAsync(buf);
        const kmlEntryName = Object.keys(zip.files).find(n => n.toLowerCase().endsWith('.kml'));
        if (!kmlEntryName) return;
        const kmlText = await zip.file(kmlEntryName)!.async('string');
        const format = new KML({ extractStyles: false });
        const features = format.readFeatures(kmlText, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
        const source = new VectorSource({ features });
        const layer = new VectorLayer({ source });
        const fileName = decodeURIComponent(url.split('/').pop() || '').replace(/\.kmz$/i, '');
        (layer as any).fileName = fileName;
        if (fileName === 'SIRGAS_SHP_distrito') {
          layer.setZIndex(10);
        } else if (fileName === 'Locais_oficina') {
          layer.setZIndex(30);
          (layer as any).setDeclutter?.(true);
        } else {
          layer.setZIndex(20);
        }
        layer.setStyle((feature) => {
          const type = feature.getGeometry()?.getType();
          const isDistrito = fileName === 'SIRGAS_SHP_distrito';
          const isLocais = fileName === 'Locais_oficina';
          if (type === 'Point' || type === 'MultiPoint') {
            if (isLocais) {
              const props = (feature as any).getProperties ? (feature as any).getProperties() : {};
              const keys = Object.keys(props).filter((k: string) => k !== 'geometry');
              const firstText = keys.map((k: string) => props[k]).find((v: any) => typeof v === 'string' && v.trim().length > 0) || '';
              const nome = feature.get('nome') || feature.get('name') || feature.get('NOME') || feature.get('description') || firstText;
              const isFlagSelected = !!feature.get('selected');
              let coordKey = '';
              try {
                const c = toLonLat((feature.getGeometry() as any).getCoordinates());
                coordKey = `${c[0].toFixed(6)},${c[1].toFixed(6)}`;
              } catch {}
              const isSelected = isFlagSelected || selectedKmzRefsRef.current.has(coordKey);
              return new Style({
                image: new Icon({ src: isSelected ? '/selected_pin.png' : '/default_pin.png', scale: 0.6 }),
                text: new Text({
                  text: nome,
                  font: '12px Inter, sans-serif',
                  fill: new Fill({ color: '#111' }),
                  stroke: new Stroke({ color: '#fff', width: 3 }),
                  offsetY: -16
                })
              });
            }
            return new Style({
              image: new CircleStyle({ radius: 4, fill: new Fill({ color: '#2563eb' }), stroke: new Stroke({ color: '#1e3a8a', width: 1 }) })
            });
          }
          if (type === 'LineString' || type === 'MultiLineString') {
            if (isDistrito) {
              return new Style({ stroke: new Stroke({ color: 'rgba(0,0,0,0)', width: 0 }) });
            }
            return new Style({ stroke: new Stroke({ color: '#2563eb', width: 2 }) });
          }
          if (type === 'Polygon' || type === 'MultiPolygon') {
            if (isDistrito) {
              return new Style({ fill: new Fill({ color: 'rgba(37,150,190,0.2)' }) });
            }
            return new Style({ stroke: new Stroke({ color: '#2563eb', width: 2 }), fill: new Fill({ color: 'rgba(37,99,235,0.12)' }) });
          }
          return new Style({ stroke: new Stroke({ color: '#2563eb', width: 2 }) });
        });
        map.addLayer(layer);
        kmzLayersRef.current.push(layer);
      } catch {}
    });

    map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f);
      const geomType = feature?.getGeometry()?.getType();
      const isPoint = geomType === 'Point' || geomType === 'MultiPoint';
      if (feature && isPoint) {
        const props = (feature as any).getProperties ? (feature as any).getProperties() : {};
        const keys = Object.keys(props).filter((k: string) => k !== 'geometry');
        const title = feature.get('title') || feature.get('name') || feature.get('NOME') || feature.get('nome') || 'Local';
        const descProp = feature.get('description');
        const details = descProp ? descProp : keys.map((k: string) => `${k}: ${props[k]}`).join('\n');
        let coords: [number, number] = [0, 0];
        try {
          const geom: any = feature.getGeometry();
          const viewCoord = typeof geom.getClosestPoint === 'function'
            ? geom.getClosestPoint(event.coordinate)
            : geom.getCoordinates();
          const c = toLonLat(viewCoord);
          coords = [c[0], c[1]];
        } catch {}
        lastClickedFeatureRef.current = feature as Feature;
        const markerData = {
          id: feature.get('id') || title,
          coordinates: coords,
          type: (feature.get('type') as MapMarker['type']) || 'default',
          title,
          description: details,
        } as MapMarker;

        setSelectedMarker(markerData);
        setIsDialogOpen(true);
      } else if (onEmptyClick) {
        const [lon, lat] = toLonLat(event.coordinate);
        onEmptyClick([lon, lat]);
      }
    });

    mapInstanceRef.current = map;
    const setVhProperty = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVhProperty();
    const handleResize = () => {
      setVhProperty();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
      kmzLayersRef.current.forEach(layer => {
        try {
          map.removeLayer(layer);
        } catch {}
      });
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.head.removeChild(style);
    };
  }, [geojsonUrls, wmsLayers, kmzUrls]);

  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    const view = mapInstanceRef.current.getView();
    view.animate({ center: fromLonLat(center), duration: 250 });
  }, [center]);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    const source = layer.getSource();
    if (!source) return;
    source.clear();
    markers.forEach((marker) => {
      const correctedCoords = marker.type === 'school'
        ? offsetCoordinates(marker.coordinates)
        : marker.coordinates;
      const feature = new Feature({
        geometry: new Point(fromLonLat(correctedCoords)),
        id: marker.id,
        type: marker.type,
        title: marker.title,
        description: marker.description,
      });
      feature.setStyle(createMarkerStyle(marker.type, theme));
      source.addFeature(feature);
    });
  }, [markers, theme]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const markersLayer = mapInstanceRef.current.getLayers().getArray().find(
        layer => layer instanceof VectorLayer
      ) as VectorLayer<VectorSource>;
      
      if (markersLayer) {
        const source = markersLayer.getSource();
        if (source) {
          source.getFeatures().forEach(feature => {
            const markerType = feature.get('type') as MapMarker['type'];
            feature.setStyle(createMarkerStyle(markerType, theme));
          });
        }
      }
    }
  }, [theme]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const currentZoom = view.getZoom();
      if (currentZoom !== undefined) {
        view.animate({
          zoom: currentZoom + 1,
          duration: 250
        });
      }
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const currentZoom = view.getZoom();
      if (currentZoom !== undefined) {
        view.animate({
          zoom: currentZoom - 1,
          duration: 250
        });
      }
    }
  };

  const handleSelectCurrent = () => {
    if (!selectedMarker || !Array.isArray(selectedMarker.coordinates)) return;
    let coords = selectedMarker.coordinates as [number, number];
    if (!coords || coords[0] == null || coords[1] == null || (coords[0] === 0 && coords[1] === 0)) {
      try {
        const geom: any = lastClickedFeatureRef.current?.getGeometry();
        const c = toLonLat(geom.getCoordinates());
        coords = [c[0], c[1]];
      } catch {}
    }
    const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
    selectedKmzRefsRef.current.add(key);
    if (singleSelection) {
      kmzLayersRef.current
        .filter((l: any) => l?.fileName === 'Locais_oficina')
        .forEach(l => {
          const src = l.getSource();
          src?.getFeatures().forEach(f => {
            try { f.set('selected', false); } catch {}
          });
        });
    }
    if (lastClickedFeatureRef.current) {
      lastClickedFeatureRef.current.set('selected', true);
      try { (lastClickedFeatureRef.current as any).changed?.(); } catch {}
    }
    kmzLayersRef.current.forEach(l => l.changed());
    if (typeof onSelectReference === 'function') {
      onSelectReference(coords);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className={`absolute w-dvw h-dvh ${className} p-2`}>
      <div 
        ref={mapRef}
        className="w-dvw h-dvh rounded-md overflow-hidden"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex flex-col gap-2 z-10">
        <Button
          onClick={handleZoomIn}
          size="sm"
          className="w-12 h-12 md:w-8 md:h-8 p-0 shadow-lg touch-manipulation"
          variant="outline"
          title="Aumentar zoom"
        >
          <Plus className="h-5 w-5 md:h-4 md:w-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          size="sm"
          className="w-12 h-12 md:w-8 md:h-8 p-0 shadow-lg touch-manipulation"
          variant="outline"
          title="Diminuir zoom"
        >
          <Minus className="h-5 w-5 md:h-4 md:w-4" />
        </Button>
      </div>
      {isMobile ? (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerContent className="h-[80vh] max-h-[80vh] min-h-[80vh] ios-drawer-fix">
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-3 text-xl font-semibold">
                {selectedMarker && (
                  <>
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{
                        backgroundColor: {
                          school: '#3B82F6',
                          house: '#EF4444',
                          default: '#6B7280',
                          selected: '#16a34a'
                        }[selectedMarker.type]
                      }}
                    />
                    {selectedMarker.title || 'Local'}
                  </>
                )}
              </DrawerTitle>
            </DrawerHeader>
            
            <div className="px-4 pb-8">
              {selectedMarker && (
                <div className="space-y-8">
                  {selectedMarker.description && (
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-4">Descrição</h4>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {selectedMarker.description}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-4">Tipo</h4>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-5 h-5 rounded-full border border-border"
                        style={{
                          backgroundColor: {
                            school: '#3B82F6',
                            house: '#EF4444',
                            default: '#6B7280',
                            selected: '#16a34a'
                          }[selectedMarker.type]
                        }}
                      />
                      <span className="text-lg text-muted-foreground capitalize">
                        {selectedMarker.type === 'school' ? 'Escola' : 
                         selectedMarker.type === 'house' ? 'Casa' : 'Ponto de Interesse'}
                      </span>
                    </div>
                  </div>
                  {selectedMarker && Array.isArray(selectedMarker.coordinates) && (typeof (enableReferenceSelection) === 'boolean' ? enableReferenceSelection : false) && (
                    <div>
                      <Button onClick={handleSelectCurrent} className="mt-2">Selecionar este ponto</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedMarker && (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{
                          backgroundColor: {
                            school: '#3B82F6',
                            house: '#EF4444',
                            default: '#6B7280',
                            selected: '#16a34a'
                          }[selectedMarker.type]
                        }}
                      />
                    {selectedMarker.title || 'Local'}
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedMarker && (
              <div className="space-y-4">
                {selectedMarker.description && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Descrição</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedMarker.description}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Tipo</h4>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-border"
                        style={{
                          backgroundColor: {
                            school: '#3B82F6',
                            house: '#EF4444',
                            default: '#6B7280',
                            selected: '#16a34a'
                          }[selectedMarker.type]
                        }}
                      />
                    <span className="text-sm text-muted-foreground capitalize">
                      {selectedMarker.type === 'school' ? 'Escola' : 
                       selectedMarker.type === 'house' ? 'Casa' : 'Ponto de Interesse'}
                    </span>
                  </div>
                </div>
                {selectedMarker && Array.isArray(selectedMarker.coordinates) && (typeof (enableReferenceSelection) === 'boolean' ? enableReferenceSelection : false) && (
                  <div>
                    <Button onClick={handleSelectCurrent} className="mt-2 w-full">Selecionar este ponto</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}