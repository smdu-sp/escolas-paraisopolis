/** @format */

import { TableSkeleton } from '@/components/data-table';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import TabsRespostas from './_components/tabs-respostas';
import {
	buscarEscolasComCadastro,
	buscarPontosOrigem,
	buscarRelatorios,
	buscarRespostas,
	IRespostaDetalhada,
} from '@/services/resposta';
import { validaUsuario } from '@/services/usuario';
import { verificaData } from '@/lib/utils';

export default async function RespostasSuspense({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	return (
		<Suspense fallback={<TableSkeleton />}>
			<Respostas searchParams={searchParams} />
		</Suspense>
	);
}

async function Respostas({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	let { pagina = 1, limite = 10, total = 0 } = await searchParams;
	const { escola = '', periodo = '' } = await searchParams;

	let dataInicio: Date | undefined;
	let dataFim: Date | undefined;
	if (periodo) {
		const [inicioStr, fimStr] = (periodo as string).split(',');
		[dataInicio, dataFim] = verificaData(inicioStr, fimStr);
	}

	const usuarioLogado = await validaUsuario();
	if (!usuarioLogado || !['DEV', 'ADM'].includes(usuarioLogado.permissao)) {
		redirect('/');
	}

	const [respostaPaginada, escolas, relatorios, pontosCalor] = await Promise.all([
		buscarRespostas(+pagina, +limite, (escola as string) || undefined, dataInicio, dataFim),
		buscarEscolasComCadastro(),
		buscarRelatorios(),
		buscarPontosOrigem(),
	]);
	pagina = respostaPaginada.pagina || 1;
	limite = respostaPaginada.limite || 10;
	total = respostaPaginada.total || 0;
	const dados: IRespostaDetalhada[] = respostaPaginada.data || [];

	return (
		<div className="px-0 md:px-8 relative pb-20 md:pb-14 h-full container mx-auto">
			<h1 className="text-xl md:text-4xl font-bold">Cadastros - Caminhos Escolares</h1>
			<TabsRespostas
				dados={dados}
				total={+total}
				pagina={+pagina}
				limite={+limite}
				escolas={escolas}
				relatorios={relatorios}
				pontosCalor={pontosCalor}
			/>
		</div>
	);
}
