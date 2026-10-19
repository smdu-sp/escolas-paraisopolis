/** @format */

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { IRespostaDetalhada } from '@/services/resposta';
import ModalTrajeto from './modal-trajeto';

export const columns: ColumnDef<IRespostaDetalhada>[] = [
	{
		accessorKey: 'escola',
		header: 'Escola',
		cell: ({ row }) => row.original.escola.nome,
	},
	{
		accessorKey: 'criadoEm',
		header: 'Data',
		cell: ({ row }) => new Date(row.original.criadoEm).toLocaleDateString('pt-BR'),
	},
	{
		accessorKey: 'qtdCriancas',
		header: () => <p className='text-center'>Crianças</p>,
		cell: ({ row }) => <p className='text-center'>{row.original.qtdCriancas}</p>,
	},
	{
		accessorKey: 'temReuniao',
		header: () => <p className='text-center'>Reunião</p>,
		cell: ({ row }) => (
			<div className='flex items-center justify-center'>
				<Badge variant={row.original.temReuniao ? 'default' : 'outline'}>
					{row.original.temReuniao ? 'Sim' : 'Não'}
				</Badge>
			</div>
		),
	},
	{
		accessorKey: 'actions',
		header: () => <p className='text-center'>Ações</p>,
		cell: ({ row }) => (
			<div className='flex items-center justify-center'>
				<ModalTrajeto resposta={row.original} />
			</div>
		),
	},
];
