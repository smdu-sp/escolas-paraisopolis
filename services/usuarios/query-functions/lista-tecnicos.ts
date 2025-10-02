/** @format */

import { IRespostaUsuario, ITecnicoFuncionario, IUsuario } from "@/types/usuario";

export async function listaTecnicos(access_token: string): Promise<IRespostaUsuario> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    try {
        const alvaraTipos = await fetch(`${baseURL}usuarios/lista-tecnicos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
            },
            next: { tags: ['funcionarios'], revalidate: 120 },
        });
        const data = await alvaraTipos.json();
        return {
            ok: true,
            error: null,
            data: data as ITecnicoFuncionario[],
            status: 200,
        };
    } catch (error) {
        console.log(error);
        return {
            ok: false,
            error: 'Não foi possível buscar a lista de técnicos:' + error,
            data: null,
            status: 500,
        };
    }
}
