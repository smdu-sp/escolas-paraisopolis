/** @format */
'use client';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { atualizarMeuPerfil } from '@/services/usuario-actions';
import { zodResolver } from '@hookform/resolvers/zod';
import { Permissao, Usuario } from '@prisma/client';
import { RefreshCcw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchema = z.object({
	nome: z.string().min(2).max(50),
	login: z.string(),
	email: z.string().email(),
	permissao: z.enum(['DEV', 'TEC', 'ADM', 'USR']),
});

interface FormProfileProps {
	user: Partial<Usuario>;
	id: string;
}

export default function FormProfile({ user }: FormProfileProps) {
	const [isPending, startTransition] = useTransition();
	const { data: session, update } = useSession();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: user.email || '',
			nome: user.nome || '',
			login: user.login || '',
			permissao:
				(user.permissao as unknown as Permissao) ?? 'USR',
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		startTransition(async () => {
			try {
				// Só o nome é editável aqui; login, e-mail e permissão não mudam pelo perfil
				const resp = await atualizarMeuPerfil({ nome: values.nome });
				if (!resp.ok) {
					toast.error(resp.erro);
				} else {
					if (session?.user) {
						const dataResp = resp.dados;
						// Você precisará ajustar isso de acordo com a estrutura da sua sessão e da resposta da API
						const updateSession = await update({
							...session,
							user: {
								...session?.user,
								nome: dataResp.nome,
								email: dataResp.email,
								login: dataResp.login,
								permissao: dataResp.permissao,
							},
						});
						console.log('Sessão atualizada:', updateSession); // Para depuração
					}

					toast.success('Usuário atualizado com sucesso');
				}
			} catch (error) {
				console.log(error);
				toast.error('Algo deu errado');
			} finally {
				window.location.reload();
			}
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-5'>
				<FormField
					control={form.control}
					name='nome'
					disabled
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nome</FormLabel>
							<FormControl>
								<Input
									placeholder='Nome Completo'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					disabled
					name='email'
					render={({ field }) => (
						<FormItem>
							<FormLabel>E-mail:</FormLabel>
							<FormControl>
								<Input
									placeholder='email@email.com'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					disabled
					name='login'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Login</FormLabel>
							<FormControl>
								<Input
									placeholder='Login'
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				{false && <Button
					disabled={isPending}
					className='w-full'>
					Atualizar{' '}
					{isPending ? <RefreshCcw className='animate-spin' /> : <RefreshCcw />}
				</Button>}
			</form>
		</Form>
	);
}
