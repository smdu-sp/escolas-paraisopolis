/** @format */

'use client';

import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import 'ol/ol.css';

interface MapaCalorProps {
	pontos: { lat: number; lng: number }[];
	centro?: [number, number];
}

export default function MapaCalor({ pontos, centro = [-46.7268192, -23.6157664] }: MapaCalorProps) {
	const mapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mapRef.current) return;

		const features = pontos.map(
			(p) => new Feature({ geometry: new Point(fromLonLat([p.lng, p.lat])) }),
		);
		const source = new VectorSource({ features });
		const heatmapLayer = new HeatmapLayer({
			source,
			blur: 20,
			radius: 12,
			gradient: ['#0000ff00', '#2563eb', '#16a34a', '#eab308', '#dc2626'],
		});

		const map = new Map({
			target: mapRef.current,
			layers: [new TileLayer({ source: new OSM() }), heatmapLayer],
			view: new View({ center: fromLonLat(centro), zoom: 13 }),
			controls: [],
		});

		if (pontos.length > 0) {
			const extent = boundingExtent(pontos.map((p) => fromLonLat([p.lng, p.lat])));
			map.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 16 });
		}

		return () => {
			map.setTarget(undefined);
		};
	}, [pontos, centro]);

	return <div ref={mapRef} className="w-full h-full rounded-md overflow-hidden" />;
}
