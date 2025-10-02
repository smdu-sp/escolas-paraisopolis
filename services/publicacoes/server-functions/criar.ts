/** @format */

'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { revalidateTag } from 'next/cache';
import { ICreatePublicacao, IPublicacao, IRespostaPublicacao } from '@/types/publicacao';

export async function criar(data: ICreatePublicacao): Promise<IRespostaPublicacao> {
	const session = await auth();
	const baseURL = process.env.NEXT_PUBLIC_API_URL;
	if (!session) redirect('/login');

	const response: Response = await fetch(`${baseURL}publicacoes/criar`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session?.access_token}`,
		},
		body: JSON.stringify(data),
	});
	const dataResponse = await response.json();
	if (response.status === 201) {
		revalidateTag('publicacoes');
		return {
			ok: true,
			error: null,
			data: dataResponse as IPublicacao,
			status: 201,
		};
	}
	if (!dataResponse)
		return {
			ok: false,
			error: 'Erro ao criar nova publicação.',
			data: null,
			status: response.status,
		};
	return {
		ok: false,
		error: dataResponse.message,
		data: null,
		status: dataResponse.statusCode,
	};
}
