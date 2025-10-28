/** @format */

'use client';

import { ColumnDef } from '@tanstack/react-table';
import ModalUpdateCreate from './modal-update-create';
import ModalDelete from './modal-delete';
import { Badge } from '@/components/ui/badge';
import { Usuario } from '@prisma/client';

export const columns: ColumnDef<Usuario>[] = [
	{
		accessorKey: 'nome',
		header: 'Nome',
	},
	{
		accessorKey: 'login',
		header: 'Usuário',
	},
	{
		accessorKey: 'email',
		header: 'E-mail',
	},
	{
		accessorKey: 'status',
		header: () => <p className='text-center'>Status</p>,
		cell: ({ row }) => {
			const status = row.original.status;
			return (
				<div className='flex items-center justify-center'>
					<Badge variant={`${status == false ? 'destructive' : 'default'}`}>
						{status ? 'Ativo' : 'Inativo'}
					</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: 'actions',
		header: () => <p className='text-center'>Ações</p>,
		cell: ({ row }) => {
			return (
				<div
					className='flex gap-2 items-center justify-center'
					key={row.id}>
					<ModalUpdateCreate
						user={row.original}
						isUpdating={true}
					/>
					<ModalDelete
						status={!row.original.status}
						id={row.original.id}
					/>
				</div>
			);
		},
	},
];
