/** @format */

import { IPaginadoPublicacao, IRespostaPublicacao } from '@/types/publicacao';

export async function buscarTudo(
	access_token: string,
	pagina: number = 1,
	limite: number = 10,
	busca: string = '',
	tipo_documento: string = 'all',
	colegiado: string = 'all',
): Promise<IRespostaPublicacao> {
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const publicacoes = await fetch(
			`${baseURL}publicacoes/buscar-tudo?pagina=${pagina}&limite=${limite}&busca=${busca}&tipo_documento=${tipo_documento}&colegiado=${colegiado}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${access_token}`,
				},
				next: { tags: ['publicacoes'], revalidate:120 },
			},
		);
		const data = await publicacoes.json();
		if (publicacoes.status === 200)
			return {
				ok: true,
				error: null,
				data: data as IPaginadoPublicacao,
				status: 200,
			};
		return {
			ok: false,
			error: data.message,
			data: null,
			status: data.statusCode,
		};
	} catch (error) {
		return {
			ok: false,
			error: 'Não foi possível buscar a lista de publicações:' + error,
			data: null,
			status: 400,
		};
	}
}
