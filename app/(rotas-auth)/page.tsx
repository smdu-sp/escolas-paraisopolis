/** @format */

import DataTable, { TableSkeleton } from '@/components/data-table';
import { Filtros } from '@/components/filtros';
import Pagination from '@/components/pagination';
import { auth } from '@/lib/auth/auth';
import * as publicacao from '@/services/publicacoes';
import { Suspense } from 'react';
import { columns } from './_components/columns';
import { IPaginadoPublicacao, IPublicacao } from '@/types/publicacao';
import ModalUpdateAndCreate from './_components/modal-update-create';
import { colegiados, tipos_documento } from '@/lib/utils';

export default async function PublicacoesSuspense({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	return (
		<Suspense fallback={<TableSkeleton />}>
			<Publicacoes searchParams={searchParams} />
		</Suspense>
	);
}

async function Publicacoes({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	let { pagina = 1, limite = 10, total = 0 } = await searchParams;
	let ok = false;
	const { busca = '', tipo_documento = 'all', colegiado = 'all' } = await searchParams;
	let dados: IPublicacao[] = [];

	const session = await auth();
	if (session && session.access_token) {
		const response = await publicacao.buscarTudo(
			session.access_token || '',
			+pagina,
			+limite,
			busca as string,
			tipo_documento as string,
			colegiado as string
		);
		const { data } = response;
		ok = response.ok;
		if (ok) {
			if (data) {
				const paginado = data as IPaginadoPublicacao;
				pagina = paginado.pagina || 1;
				limite = paginado.limite || 10;
				total = paginado.total || 0;
				dados = paginado.data || [];
			}
			const paginado = data as IPaginadoPublicacao;
			dados = paginado.data || [];
		}
	}

	return (
		<div className=' w-full px-0 md:px-8 relative pb-20 md:pb-14 h-full md:container mx-auto'>
			<h1 className='text-xl md:text-4xl font-bold'>Publicações</h1>
			<div className='grid grid-cols-1 max-w-sm mx-auto md:max-w-full gap-y-3 my-5   w-full '>
				<Filtros
					camposFiltraveis={[
						{
							nome: 'Busca',
							tag: 'busca',
							tipo: 0,
							placeholder: 'Digite o nome, email ou login',
						},
						{
							nome: 'Tipo',
							tag: 'tipo_documento',
							tipo: 2,
							default: 'all',
							valores: tipos_documento,
						},
						{
							nome: 'Colegiado',
							tag: 'colegiado',
							tipo: 2,
							default: 'all',
							valores: colegiados,
						}
					]}
				/>
				<DataTable
					columns={columns}
					data={dados || []}
				/>

				{dados && dados.length > 0 && (
					<Pagination
						total={+total}
						pagina={+pagina}
						limite={+limite}
					/>
				)}
			</div>
			<div className='absolute bottom-10 md:bottom-5 right-2 md:right-8 hover:scale-110'>
				<ModalUpdateAndCreate isUpdating={false} />
			</div>
		</div>
	);
}
