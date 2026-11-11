/** @format */

import { redirect } from 'next/navigation';
import { validaUsuario } from '@/services/usuario';
import { listarEscolas } from '@/services/escola';
import PainelEscolas from './_components/painel-escolas';

export const dynamic = 'force-dynamic';

export default async function EscolasPage() {
	const usuarioLogado = await validaUsuario();
	if (!usuarioLogado || !['DEV', 'ADM'].includes(usuarioLogado.permissao)) {
		redirect('/');
	}
	const escolas = await listarEscolas();

	return (
		<div className='px-0 md:px-8 relative pb-20 md:pb-14 h-full container mx-auto'>
			<h1 className='text-xl md:text-4xl font-bold mb-5'>Escolas</h1>
			<PainelEscolas escolasIniciais={escolas} />
		</div>
	);
}
