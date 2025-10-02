/** @format */

import { ICoordenadoriaSelect, IRespostaCoordenadoria } from "@/types/coordenadorias";

export async function listaCompleta(access_token: string): Promise<IRespostaCoordenadoria> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    try {
        const alvaraTipos = await fetch(`${baseURL}coordenadorias/lista-completa`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
            },
			next: { tags: ['coordenadorias'], revalidate: 120 },
        });
        const data = await alvaraTipos.json();
        return {
            ok: true,
            error: null,
            data: data as ICoordenadoriaSelect[],
            status: 200,
        };
    } catch (error) {
        console.log(error);
        return {
            ok: false,
            error: 'Não foi possível buscar a lista de coordenadorias:' + error,
            data: null,
            status: 500,
        };
    }
}
