/** @format */

import { IPublicacao, IRespostaPublicacao } from '@/types/publicacao';

export async function buscarPorId(
	id: string,
	access_token: string,
): Promise<IRespostaPublicacao> {
	if (!id || id === '')
		return {
			ok: false,
			error: 'Não foi possível buscar a publicação, ID vazio.',
			data: null,
			status: 400,
		};
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	try {
		const publicacoes = await fetch(`${baseURL}publicacoes/buscar-por-id/${id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${access_token}`,
			},
			next: { tags: ['publicacao-por-id'] },
		});
		const data = await publicacoes.json();
		if (publicacoes.status === 200)
			return {
				ok: true,
				error: null,
				data: data as IPublicacao,
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
			error: 'Não foi possível buscar a publicação:' + error,
			data: null,
			status: 400,
		};
	}
}
