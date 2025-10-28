/** @format */

'use client';

import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { atualizarUsuario, criarUsuario } from '@/services/usuario';
import { zodResolver } from '@hookform/resolvers/zod';
import { Permissao, Usuario } from '@prisma/client';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const formSchemaUsuario = z.object({
	nome: z.string(),
	login: z.string(),
	email: z.string().email(),
	permissao: z.enum(['DEV', 'TEC', 'ADM', 'USR']),
});

const formSchema = z.object({
	login: z.string(),
});

interface FormUsuarioProps {
	isUpdating: boolean;
	user?: Partial<Usuario>;
}

export default function FormUsuario({ isUpdating, user }: FormUsuarioProps) {
	const [isPending, startTransition] = useTransition();
	const formUsuario = useForm<z.infer<typeof formSchemaUsuario>>({
		resolver: zodResolver(formSchemaUsuario),
		defaultValues: {
			email: user?.email || '',
			login: user?.login || '',
			nome: user?.nome || '',
			permissao:
				(user?.permissao as unknown as 'DEV' | 'TEC' | 'ADM' | 'USR') ?? 'USR',
		},
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			login: '',
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const session = await auth();
		if (!session) {
			toast.error('Não autorizado');
			return;
		}
		const { login } = values;
		const resp = await fetch(`/api/ldap/buscar-por-login/${login}`);
		if (resp.status !== 200) {
			toast.error('Usuário não encontrado');
			return;
		}
		const usuario = await resp.json();
		if (usuario) {
			toast.success('Usuário encontrado', { description: usuario.nome });
			formUsuario.setValue('nome', usuario.nome);
			formUsuario.setValue('email', usuario.email);
			formUsuario.setValue('login', usuario.login);
		}
	}

	async function onSubmitUser(values: z.infer<typeof formSchemaUsuario>) {
		startTransition(async () => {
			if (isUpdating && user?.id) {
				const resp = await atualizarUsuario(user?.id, {
					permissao: values.permissao as unknown as Permissao,
				});
				if (!resp)
					toast.error('Algo deu errado');
				if (resp) {
					toast.success('Usuário Atualizado', { description: resp.status });
					document.getElementById('close-dialog-voltar')?.click();
				}
			} else {
				const { email, login, nome, permissao } = values;
				const resp = await criarUsuario({
					email,
					login,
					nome,
					permissao: permissao as unknown as Permissao,
				});
				if (!resp) toast.error('Algo deu errado');
				if (resp) {
					toast.success('Usuário Criado', { description: resp.status });
					document.getElementById('close-dialog-voltar')?.click();
				}
			}
		});
	}

	return (
		<>
			{!isUpdating && (
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className=' flex items-end gap-2 w-full mb-5'>
						<FormField
							control={form.control}
							name='login'
							render={({ field }) => (
								<FormItem className='w-full'>
									<FormLabel>Login de rede</FormLabel>
									<FormControl>
										<Input
											placeholder='Login do usuário'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							disabled={form.formState.isLoading || !form.formState.isValid}
							type='submit'>
							{form.formState.isLoading || form.formState.isSubmitting ? (
								<>
									Buscar <Loader2 className='animate-spin' />
								</>
							) : (
								<>
									Buscar <ArrowRight />
								</>
							)}
						</Button>
					</form>
				</Form>
			)}

			<Form {...formUsuario}>
				<form
					onSubmit={formUsuario.handleSubmit(onSubmitUser)}
					className='space-y-4'>
					<FormField
						control={formUsuario.control}
						name='login'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Login de rede</FormLabel>
								<FormControl>
									<Input
										disabled
										placeholder='Login do usuário'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='nome'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nome</FormLabel>
								<FormControl>
									<Input
										disabled
										placeholder='Nome do usuário'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>E-mail</FormLabel>
								<FormControl>
									<Input
										disabled
										type='email'
										placeholder='E-mail do usuário'
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={formUsuario.control}
						name='permissao'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Permissão</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={'Defina a permissão'} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value='DEV'>Desenvolvedor</SelectItem>
										<SelectItem value='TEC'>Técnico</SelectItem>
										<SelectItem value='ADM'>Administrador</SelectItem>
										<SelectItem value='USR'>Usuário</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className='flex gap-2 items-center justify-end'>
						<DialogClose id="close-dialog-voltar" asChild>
							<Button variant={'outline'}>Voltar</Button>
						</DialogClose>
						<Button
							disabled={isPending}
							type='submit'>
							{isUpdating ? (
								<>
									Atualizar {isPending && <Loader2 className='animate-spin' />}
								</>
							) : (
								<>
									Adicionar {isPending && <Loader2 className='animate-spin' />}
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</>
	);
}
