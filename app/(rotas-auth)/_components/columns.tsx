/** @format */

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Colegiados, IPublicacao, Tipos_Documento } from '@/types/publicacao';
import { format } from 'date-fns';
import { capitalize, formataProcesso } from '@/lib/utils';



export const columns: ColumnDef<IPublicacao>[] = [
	{
		accessorKey: 'numero_processo',
		header: () => <p className='text-left'>Processo</p>,
		cell: ({ row }) => {
			const processo = formataProcesso(row.original.numero_processo.padStart(12, '0'));
			return (
				<p className='flex text-left'>
					{processo}
				</p>
			);
		},
	},
	{
		accessorKey: 'tipo_documento',
		header: () => <p className='text-center'>Tipo</p>,
		cell: ({ row }) => {
			return (
				<div className='flex items-center justify-center'>
					{Tipos_Documento[row.original.tipo_documento as unknown as keyof typeof Tipos_Documento]}
				</div>
			);
		},
	},
	{
		accessorKey: 'colegiado',
		header: () => <p className='text-center'>Colegiado</p>,
		cell: ({ row }) => {
			return (
				<div className='flex items-center justify-center'>
					{Colegiados[row.original.colegiado as keyof typeof Colegiados]}
				</div>
			);
		},
	},
	{
		accessorKey: 'data_emissao',
		header: () => <p className='text-center'>Emissão</p>,
		cell: ({ row }) => {
			const dataOnly = row.original.data_emissao.toString().split('T')[0];
			const dataSplit = dataOnly.split('-');
			const data_emissao = `${dataSplit[2]}/${dataSplit[1]}/${dataSplit[0]}`;
			return (
				<div className='flex items-center justify-center'>
					{data_emissao}
				</div>
			);
		},
	},
	{
		accessorKey: 'data_publicacao',
		header: () => <p className='text-center'>Publicação</p>,
		cell: ({ row }) => {
			const dataOnly = row.original.data_publicacao.toString().split('T')[0];
			const dataSplit = dataOnly.split('-');
			const data_publicacao = `${dataSplit[2]}/${dataSplit[1]}/${dataSplit[0]}`;
			return (
				<div className='flex items-center justify-center'>
					{data_publicacao}
				</div>
			);
		},
	},
	{
		accessorKey: 'prazo',
		header: () => <p className='text-center'>Prazo</p>,
		cell: ({ row }) => {
			return (
				<div className='flex items-center justify-center'>
					{row.original.prazo} dias
				</div>
			);
		},
	},
	{
		accessorKey: 'tecnico',
		header: () => <p className='text-center'>Técnico</p>,
		cell: ({ row }) => {
			const tecnico = row.original.tecnico?.nome;
			const nomeSplit = tecnico?.split(' ');
			const nome = `${nomeSplit?.[0]} ${nomeSplit?.[nomeSplit.length - 1]}`;
			return (
				<div className='flex items-center justify-center'>
					{nome ? capitalize(nome) : ""}
				</div>
			);
		},
	},
	{
		accessorKey: 'coordenadoria',
		header: () => <p className='text-center'>Coordenadoria</p>,
		cell: ({ row }) => {
			const coordenadoria = row.original.coordenadoria;
			return (
				<div className='flex items-center justify-center' title={coordenadoria?.nome}>
					{coordenadoria ? coordenadoria?.sigla : ""}
				</div>
			);
		},
	},
];
