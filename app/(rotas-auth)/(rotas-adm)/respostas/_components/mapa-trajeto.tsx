/** @format */

'use client';

import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Icon, Stroke, Fill, Text } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import 'ol/ol.css';
import { IPontoResposta } from '@/services/resposta';

interface MapaTrajetoProps {
	escola: { nome: string; latitude: number; longitude: number };
	pontos: IPontoResposta[];
}

export default function MapaTrajeto({ escola, pontos }: MapaTrajetoProps) {
	const mapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mapRef.current) return;
		const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
		const origem = pontos.find((p) => p.tipo === 'ORIGEM');
		const referencias = pontos
			.filter((p) => p.tipo === 'REFERENCIA')
			.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
		const reuniao = pontos.find((p) => p.tipo === 'REUNIAO');

		const markerStyle = (src: string, label?: string) =>
			new Style({
				image: new Icon({ src: `${basePath}${src}`, scale: 0.5, anchor: [0.5, 1], anchorXUnits: 'fraction', anchorYUnits: 'fraction' }),
				text: label
					? new Text({
							text: label,
							font: '12px Inter, sans-serif',
							fill: new Fill({ color: '#111' }),
							stroke: new Stroke({ color: '#fff', width: 3 }),
							offsetY: -30,
					  })
					: undefined,
			});

		const features: Feature[] = [];
		const coordenadas: [number, number][] = [];

		const escolaCoord: [number, number] = [escola.longitude, escola.latitude];
		coordenadas.push(escolaCoord);
		features.push(new Feature({ geometry: new Point(fromLonLat(escolaCoord)) }));
		features[features.length - 1].setStyle(markerStyle('/escola_pin.png', escola.nome));

		if (origem) {
			const coord: [number, number] = [origem.longitude, origem.latitude];
			coordenadas.push(coord);
			const f = new Feature({ geometry: new Point(fromLonLat(coord)) });
			f.setStyle(markerStyle('/casa_pin.png', origem.nomeLocal || 'Casa'));
			features.push(f);
		}

		referencias.forEach((ref, i) => {
			const coord: [number, number] = [ref.longitude, ref.latitude];
			coordenadas.push(coord);
			const f = new Feature({ geometry: new Point(fromLonLat(coord)) });
			f.setStyle(markerStyle('/selected_pin.png', ref.nomeLocal || `Ponto ${i + 1}`));
			features.push(f);
		});

		if (reuniao) {
			const coord: [number, number] = [reuniao.longitude, reuniao.latitude];
			coordenadas.push(coord);
			const f = new Feature({ geometry: new Point(fromLonLat(coord)) });
			f.setStyle(markerStyle('/default_pin.png', reuniao.nomeLocal || 'Local de reunião'));
			features.push(f);
		}

		if (origem) {
			const rota = [origem, ...referencias].map((p) => fromLonLat([p.longitude, p.latitude]));
			rota.push(fromLonLat(escolaCoord));
			const linha = new Feature({ geometry: new LineString(rota) });
			linha.setStyle(new Style({ stroke: new Stroke({ color: '#2563eb', width: 3, lineDash: [8, 6] }) }));
			features.unshift(linha);
		}

		const source = new VectorSource({ features });
		const layer = new VectorLayer({ source });

		const map = new Map({
			target: mapRef.current,
			layers: [new TileLayer({ source: new OSM() }), layer],
			view: new View({ center: fromLonLat(escolaCoord), zoom: 14 }),
			controls: [],
		});

		if (coordenadas.length > 1) {
			const extent = boundingExtent(coordenadas.map((c) => fromLonLat(c)));
			map.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 17 });
		}

		return () => {
			map.setTarget(undefined);
		};
	}, [escola, pontos]);

	return <div ref={mapRef} className="w-full h-full rounded-md overflow-hidden" />;
}
