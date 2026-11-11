/** @format */

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/data-table';
import { Filtros, TiposFiltros } from '@/components/filtros';
import Pagination from '@/components/pagination';
import { getColumns } from './columns';
import Relatorios from './relatorios';
import AcoesExclusao from './acoes-exclusao';
import { IRelatorios, IRespostaDetalhada } from '@/services/resposta';

const MapaCalor = dynamic(() => import('./mapa-calor'), { ssr: false });

interface TabsRespostasProps {
	dados: IRespostaDetalhada[];
	total: number;
	pagina: number;
	limite: number;
	escolas: { id: string; nome: string }[];
	relatorios: IRelatorios;
	pontosCalor: { lat: number; lng: number }[];
	podeExcluir: boolean;
}

export default function TabsRespostas({
	dados,
	total,
	pagina,
	limite,
	escolas,
	relatorios,
	pontosCalor,
	podeExcluir,
}: TabsRespostasProps) {
	const [selecao, setSelecao] = useState<RowSelectionState>({});
	// Nova página/filtro: a seleção anterior não vale mais
	useEffect(() => setSelecao({}), [dados]);
	const columns = useMemo(() => getColumns(podeExcluir), [podeExcluir]);
	const selecionadas = Object.keys(selecao).filter((id) => selecao[id]);

	return (
		<Tabs defaultValue="lista" className="w-full my-5">
			<TabsList>
				<TabsTrigger value="lista">Lista</TabsTrigger>
				<TabsTrigger value="calor">Mapa de calor</TabsTrigger>
				<TabsTrigger value="relatorios">Relatórios</TabsTrigger>
			</TabsList>

			<TabsContent value="lista" className="space-y-3 mt-4">
				<Filtros
					camposFiltraveis={[
						{
							nome: 'Escola',
							tag: 'escola',
							tipo: TiposFiltros.SELECT,
							valores: escolas.map((e) => ({ value: e.id, label: e.nome })),
						},
						{
							nome: 'Período',
							tag: 'periodo',
							tipo: TiposFiltros.DATA,
						},
					]}
				/>
				{podeExcluir && (
					<AcoesExclusao
						selecionadas={selecionadas}
						onLimparSelecao={() => setSelecao({})}
						total={total}
						escolas={escolas}
					/>
				)}
				<DataTable
					columns={columns}
					data={dados}
					getRowId={(r) => r.id}
					rowSelection={podeExcluir ? selecao : undefined}
					onRowSelectionChange={podeExcluir ? setSelecao : undefined}
				/>
				{dados.length > 0 && <Pagination total={total} pagina={pagina} limite={limite} />}
			</TabsContent>

			<TabsContent value="calor" className="mt-4">
				<div className="h-[70vh] w-full">
					<MapaCalor pontos={pontosCalor} />
				</div>
			</TabsContent>

			<TabsContent value="relatorios" className="mt-4">
				<Relatorios relatorios={relatorios} />
			</TabsContent>
		</Tabs>
	);
}
