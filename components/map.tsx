'use client';

import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import { Style, Icon } from 'ol/style';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls, Attribution } from 'ol/control';
import 'ol/ol.css';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus, Minus, Sun, Moon } from 'lucide-react';
import { useTheme } from "next-themes";

export interface MapMarker {
  id: string;
  coordinates: [number, number] | any; // [longitude, latitude]
  type: 'school' | 'house' | 'default';
  title?: string;
  description?: string;
}

interface MapComponentProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  className?: string;
  markers?: MapMarker[];
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
  markers = []
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer<any> | null>(null);
  
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  const createMarkerStyle = (type: MapMarker['type'], currentTheme?: string) => {
    const pins = {
      school: "/escola_pin.png",
      house: "/casa_pin.png",
      default: "/default_pin.png",
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

    markers.forEach((marker) => {
      const correctedCoords = offsetCoordinates(marker.coordinates);
      
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
      ],
      view: new View({
          center: fromLonLat(offsetCoordinates(center)),
          zoom: zoom,
        }),
    });

    // Add click event to show dialog
    map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
        return feature;
      });
      
      if (feature && feature.get('id')) {
        const markerData = {
          id: feature.get('id'),
          coordinates: [0, 0],
          type: feature.get('type'),
          title: feature.get('title'),
          description: feature.get('description'),
        } as MapMarker;

        setSelectedMarker(markerData);
        setIsDialogOpen(true);
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.head.removeChild(style);
    };
  }, [center, zoom, markers, theme]);

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
                          default: '#6B7280'
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
                            default: '#6B7280'
                          }[selectedMarker.type]
                        }}
                      />
                      <span className="text-lg text-muted-foreground capitalize">
                        {selectedMarker.type === 'school' ? 'Escola' : 
                         selectedMarker.type === 'house' ? 'Casa' : 'Ponto de Interesse'}
                      </span>
                    </div>
                  </div>
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
                          default: '#6B7280'
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
                          default: '#6B7280'
                        }[selectedMarker.type]
                      }}
                    />
                    <span className="text-sm text-muted-foreground capitalize">
                      {selectedMarker.type === 'school' ? 'Escola' : 
                       selectedMarker.type === 'house' ? 'Casa' : 'Ponto de Interesse'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}