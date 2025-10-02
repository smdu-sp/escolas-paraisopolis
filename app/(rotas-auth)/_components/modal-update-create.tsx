/** @format */

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, SquarePen } from 'lucide-react';
import FormPublicacao from './form-publicacao';
import { IPublicacao } from '@/types/publicacao';
import * as coordenadorias from '@/services/coordenadorias';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ICoordenadoriaSelect } from '@/types/coordenadorias';
import { ITecnicoFuncionario } from '@/types/usuario';
import { listaTecnicos } from '@/services/usuarios';

export default async function ModalUpdateAndCreate({
	isUpdating,
	publicacao,
}: {
	isUpdating: boolean;
	publicacao?: Partial<IPublicacao>;
}) {
	const coordenadoriasSelect: ICoordenadoriaSelect[] = [];
	const tecnicosSelect: ITecnicoFuncionario[] = [];
	const session = await auth();
	if (!session) redirect('/login');
	const coordenadoriasResposta = await coordenadorias.listaCompleta(session.access_token);
	if (coordenadoriasResposta.ok) coordenadoriasSelect.push(...coordenadoriasResposta.data as ICoordenadoriaSelect[]);
	const tecnicosResposta = await listaTecnicos(session.access_token);
	if (tecnicosResposta.ok) tecnicosSelect.push(...tecnicosResposta.data as ITecnicoFuncionario[]);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size={'icon'}
					variant={'outline'}
					className={`${
						isUpdating
							? 'bg-background hover:bg-primary '
							: 'bg-primary hover:bg-primary hover:opacity-70'
					} group transition-all ease-linear duration-200`}>
					{isUpdating ? (
						<SquarePen
							size={28}
							className='text-primary group-hover:text-white group'
						/>
					) : (
						<Plus
							size={28}
							className='text-white group'
						/>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isUpdating ? 'Editar ' : 'Criar '}Publicação</DialogTitle>
					<DialogDescription>
						{isUpdating ? 'Gerencie as informações da publicação selecionada' : 'Insira os dados da nova publicação'}
					</DialogDescription>
				</DialogHeader>
				<FormPublicacao
					coordenadorias={coordenadoriasSelect}
					tecnicos={tecnicosSelect}
					publicacao={publicacao}
					isUpdating={isUpdating}
				/>
			</DialogContent>
		</Dialog>
	);
}
