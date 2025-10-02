/** @format */

'use server';

import { auth } from '@/lib/auth/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { IPublicacao, IRespostaPublicacao, IUpdatePublicacao } from '@/types/publicacao';

export async function atualizar(
	id: string,
	data: IUpdatePublicacao,
): Promise<IRespostaPublicacao> {
	const session = await auth();
	if (!session) redirect('/login');
	const baseURL = process.env.NEXT_PUBLIC_API_URL;

	try {
		const response: Response = await fetch(
			`${baseURL}publicacoes/atualizar/${id}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${session?.access_token}`,
				},
				body: JSON.stringify(data),
			},
		);
		const dataResponse = await response.json();

		if (response.status === 200) {
			revalidateTag('publicacoes');
			revalidateTag('publicacao-por-id');
			revalidatePath('/');
			return {
				ok: true,
				error: null,
				data: dataResponse as IPublicacao,
				status: 200,
			};
		}
		if (!dataResponse) {
			return {
				ok: false,
				error: 'Erro ao atualizar publicação.',
				data: null,
				status: response.status,
			};
		}
	} catch (error) {
		console.log(error);
		return {
			ok: false,
			error: 'Erro ao atualizar publicação.',
			data: null,
			status: 500,
		};
	}
	return {
		ok: false,
		error: 'Erro inesperado',
		data: null,
		status: 500,
	};
}
