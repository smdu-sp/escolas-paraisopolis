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
import Collection from 'ol/Collection';
import Translate from 'ol/interaction/Translate';
import { Style, Icon, Stroke, Fill, Text } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import 'ol/ol.css';

export interface EscolaMapa {
	id: string;
	nome: string;
	latitude: number;
	longitude: number;
}

interface MapaEscolasProps {
	escolas: EscolaMapa[];
	selecionadaId: string | null;
	onSelecionar: (id: string) => void;
	onMover: (id: string, latitude: number, longitude: number) => void;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function estilo(nome: string, selecionada: boolean) {
	return new Style({
		image: new Icon({
			src: `${basePath}${selecionada ? '/selected_escola_pin.png' : '/escola_pin.png'}`,
			scale: selecionada ? 0.7 : 0.55,
			anchor: [0.5, 1],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction',
		}),
		text: new Text({
			text: nome,
			font: `${selecionada ? 'bold ' : ''}12px Inter, sans-serif`,
			fill: new Fill({ color: '#111' }),
			stroke: new Stroke({ color: '#fff', width: 3 }),
			offsetY: -42,
		}),
		zIndex: selecionada ? 10 : 1,
	});
}

export default function MapaEscolas({ escolas, selecionadaId, onSelecionar, onMover }: MapaEscolasProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapaRef = useRef<Map | null>(null);
	const sourceRef = useRef<VectorSource | null>(null);
	const arrastaveisRef = useRef(new Collection<Feature>());
	const callbacksRef = useRef({ onSelecionar, onMover, selecionadaId });
	callbacksRef.current = { onSelecionar, onMover, selecionadaId };
	const enquadradoRef = useRef(false);

	useEffect(() => {
		if (!mapRef.current) return;
		const source = new VectorSource();
		sourceRef.current = source;
		const mapa = new Map({
			target: mapRef.current,
			layers: [new TileLayer({ source: new OSM() }), new VectorLayer({ source, zIndex: 10 })],
			view: new View({ center: fromLonLat([-46.7268192, -23.6187664]), zoom: 16 }),
		});

		const translate = new Translate({ features: arrastaveisRef.current });
		translate.on('translateend', (e) => {
			const feature = e.features.item(0);
			const geom = feature?.getGeometry() as Point | undefined;
			if (!feature || !geom) return;
			const [lng, lat] = toLonLat(geom.getCoordinates());
			callbacksRef.current.onMover(feature.getId() as string, lat, lng);
		});
		mapa.addInteraction(translate);

		mapa.on('singleclick', (e) => {
			const feature = mapa.forEachFeatureAtPixel(e.pixel, (f) => f);
			if (feature) {
				callbacksRef.current.onSelecionar(feature.getId() as string);
				return;
			}
			const { selecionadaId } = callbacksRef.current;
			if (selecionadaId) {
				const [lng, lat] = toLonLat(e.coordinate);
				callbacksRef.current.onMover(selecionadaId, lat, lng);
			}
		});
		mapa.on('pointermove', (e) => {
			const alvo = mapa.getTargetElement();
			alvo.style.cursor = mapa.hasFeatureAtPixel(e.pixel) ? 'pointer' : '';
		});

		mapaRef.current = mapa;
		return () => {
			mapa.setTarget(undefined);
			mapaRef.current = null;
		};
	}, []);

	useEffect(() => {
		const source = sourceRef.current;
		if (!source) return;
		source.clear();
		arrastaveisRef.current.clear();
		escolas.forEach((escola) => {
			const feature = new Feature({ geometry: new Point(fromLonLat([escola.longitude, escola.latitude])) });
			feature.setId(escola.id);
			const selecionada = escola.id === selecionadaId;
			feature.setStyle(estilo(escola.nome, selecionada));
			source.addFeature(feature);
			if (selecionada) arrastaveisRef.current.push(feature);
		});
		if (!enquadradoRef.current && escolas.length && mapaRef.current) {
			enquadradoRef.current = true;
			const extent = boundingExtent(escolas.map((e) => fromLonLat([e.longitude, e.latitude])));
			mapaRef.current.getView().fit(extent, { padding: [80, 80, 80, 80], maxZoom: 17 });
		}
	}, [escolas, selecionadaId]);

	// Centraliza na escola ao selecioná-la (não ao arrastar)
	useEffect(() => {
		if (!selecionadaId || !mapaRef.current) return;
		const escola = escolas.find((e) => e.id === selecionadaId);
		if (!escola) return;
		mapaRef.current.getView().animate({ center: fromLonLat([escola.longitude, escola.latitude]), duration: 300 });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selecionadaId]);

	return <div ref={mapRef} className='h-full w-full rounded-md overflow-hidden border' />;
}
