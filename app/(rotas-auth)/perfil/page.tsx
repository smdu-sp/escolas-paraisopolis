/** @format */

import { AvatarUploader } from '@/components/avatar-uploader';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import FormProfile from './components/form-profile';
import { meuUsuario } from '@/services/usuario';

export default async function Perfil() {
	const session = await auth();

	if (!session) {
		redirect('/login');
	}

	const usuario = await meuUsuario(session?.user.id);
	if (!usuario) {
		return <div>Usuário não encontrado</div>;
	}

	return (
		<div className='mx-auto px-0 md:px-8 pb-10 w-full'>
			<h1 className='text-xl md:text-4xl font-bold md:mt-5'>Perfil</h1>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-5 my-5'>
				{/* Avatar section */}
				<Card className='md:col-span-1 h-full'>
					<CardHeader>
						<CardTitle className='text-base md:text-xl'>
						Avatar
						</CardTitle>
					</CardHeader>
					<CardContent className='bg-card rounded-xl flex justify-center items-center mb-5 h-full'>
						<AvatarUploader
							avatarUrl={usuario.avatar ?? ''}
							id={session?.user.id}
						/>
					</CardContent>
				</Card>
				{/* Profile details */}
				<Card className='md:col-span-2 h-full'>
					<CardHeader>
						<CardTitle className='text-base md:text-xl'>
							Informações Pessoais
						</CardTitle>
						<CardDescription>
							Confira seus dados pessoais
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<FormProfile
							user={usuario}
							id={session?.user.id}
						/>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className='text-base md:text-xl'>
						Atividade Recente
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col md:flex-row justify-start md:gap-3 md:items-center p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors'>
						<span>Usuário criado em:</span>
						<span className='text-sm text-muted-foreground'>
							{new Date(usuario?.criadoEm).toLocaleString('pt-BR')}
						</span>
					</div>
					<div className='flex flex-col md:flex-row justify-start md:gap-3 md:items-center p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors'>
						<span>Usuário atualizado em:</span>
						<span className='text-sm text-muted-foreground'>
							{new Date(usuario.atualizadoEm).toLocaleString('pt-BR')}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
