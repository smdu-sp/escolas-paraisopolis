import { NextRequest } from "next/server";

export const runtime = 'nodejs';

/**
 * Busca de endereço (geocodificação) via Nominatim/OpenStreetMap, limitada à
 * cidade de São Paulo. Feita pelo servidor para centralizar User-Agent e cache.
 * Política do Nominatim: no máximo 1 requisição/s e sem autocomplete — por isso
 * o front só busca quando a pessoa confirma (Enter / botão).
 */
const GEOCODER_URL = process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
// lon_min, lat_max, lon_max, lat_min — município de São Paulo
const VIEWBOX_SP = '-46.83,-23.36,-46.36,-24.01';

export interface ResultadoGeocode {
    nome: string;
    endereco: string;
    lat: number;
    lng: number;
}

const cache = new Map<string, { em: number; dados: ResultadoGeocode[] }>();
const CACHE_MS = 1000 * 60 * 60 * 24;
let ultimaRequisicao = 0;

type ItemNominatim = {
    lat: string;
    lon: string;
    name?: string;
    display_name: string;
    address?: Record<string, string>;
};

function resumirEndereco(item: ItemNominatim) {
    const a = item.address || {};
    const rua = a.road || a.pedestrian || a.footway || '';
    const numero = a.house_number ? `, ${a.house_number}` : '';
    const bairro = a.suburb || a.neighbourhood || a.quarter || '';
    const partes = [rua ? `${rua}${numero}` : '', bairro].filter(Boolean);
    return partes.length ? partes.join(' - ') : item.display_name.split(',').slice(0, 3).join(',');
}

export async function GET(request: NextRequest) {
    const q = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 200);
    if (q.length < 3) return Response.json([]);

    const chave = q.toLowerCase();
    const emCache = cache.get(chave);
    if (emCache && Date.now() - emCache.em < CACHE_MS) return Response.json(emCache.dados);

    const espera = 1000 - (Date.now() - ultimaRequisicao);
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaRequisicao = Date.now();

    const url = new URL(GEOCODER_URL);
    // A busca já fica restrita ao município pelo viewbox; acrescentar "São Paulo"
    // ao texto faz o Nominatim deixar de achar vários endereços de Paraisópolis.
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycodes', 'br');
    url.searchParams.set('viewbox', VIEWBOX_SP);
    url.searchParams.set('bounded', '1');
    url.searchParams.set('accept-language', 'pt-BR');

    try {
        const resp = await fetch(url, {
            headers: { 'User-Agent': 'caminhos-escolares-paraisopolis/1.0' },
            signal: AbortSignal.timeout(10000),
        });
        if (!resp.ok) return Response.json({ error: 'Falha na busca de endereço' }, { status: 502 });
        const itens = (await resp.json()) as ItemNominatim[];
        const dados: ResultadoGeocode[] = itens.map((item) => ({
            nome: item.name || resumirEndereco(item),
            endereco: resumirEndereco(item),
            lat: Number(item.lat),
            lng: Number(item.lon),
        }));
        if (dados.length) cache.set(chave, { em: Date.now(), dados });
        return Response.json(dados);
    } catch {
        return Response.json({ error: 'Serviço de endereços indisponível' }, { status: 502 });
    }
}
