/** @format */

'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn, colegiados, formataProcesso, tipos_documento } from '@/lib/utils';
import { ITecnicoFuncionario, IUsuario } from '@/types/usuario';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from "date-fns"
import { ICoordenadoriaSelect } from '@/types/coordenadorias';
import { FormCombobox } from '@/components/form-combobox';
import * as publicacoes from '@/services/publicacoes';

const formSchema = z.object({
	numero_processo: z.string().min(16).max(19),
    tipo_documento: z.enum(['COMUNIQUESE', 'INDEFERIMENTO', 'DEFERIMENTO']),
	colegiado: z.enum(['AR', 'RR', 'CEUSO', 'CAIEPS', 'CAEHIS', 'CPPU', 'CTLU']),
    tecnico_rf: z.string(),
    coordenadoria_id: z.string(),
    data_emissao: z.date(),
    data_publicacao: z.date(),
    prazo: z.number(),
});

interface FormPublicacaoProps {
	isUpdating: boolean;
	publicacao?: Partial<IUsuario>;
	coordenadorias: ICoordenadoriaSelect[];
	tecnicos: ITecnicoFuncionario[];
}

export default function FormPublicacao({ isUpdating, publicacao, coordenadorias, tecnicos }: FormPublicacaoProps) {
	const [isPending, startTransition] = useTransition();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			numero_processo: '',
			colegiado: 'AR',
			tipo_documento: 'COMUNIQUESE',
			tecnico_rf: '',
			coordenadoria_id: '',
			data_emissao: new Date(),
			data_publicacao: new Date(),
			prazo: 30,
		},
	});

	const { data: session } = useSession();

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const token = session?.access_token;
		if (!token) {
			toast.error('Não autorizado');
			return;
		}
		startTransition(async () => {
			const response = await publicacoes.criar(values);
			if (response.error) {
				toast.error('Algo deu errado', { description: response.error });
			}
			if (response.ok) {
				toast.success('Publicação criada com sucesso');
			}
		})
	}

	return (
		<>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className='space-y-4'>
					<div className='grid grid-cols-4 gap-4'>
						<FormField
							control={form.control}
							name='numero_processo'
							render={({ field }) => (
								<FormItem className='col-span-2'>
									<FormLabel>Processo</FormLabel>
									<FormControl>
										<Input
											placeholder='Número do processo'
											{...field}
											onChange={(e) => {
												field.onChange(formataProcesso(e.target.value));
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='colegiado'
							render={({ field }) => (
								<FormItem className='col-span-2'>
									<FormLabel>Colegiado</FormLabel>
									<FormControl>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={'Colegiado'} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{colegiados.map(({ value, label }) => {
													return <SelectItem value={value} key={value}>{label}</SelectItem>
												})}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='data_emissao'
							render={({ field }) => (
								<FormItem className='col-span-2'>
									<FormLabel>Data de emissão</FormLabel>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button
												variant={"outline"}
												className={cn(
													"justify-start text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
												>
												<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													initialFocus
												/>
											</PopoverContent>
											</Popover>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='data_publicacao'
							render={({ field }) => (
								<FormItem className='col-span-2'>
									<FormLabel>Data de publicação</FormLabel>
									<FormControl>
										<Popover>
											<PopoverTrigger asChild>
												<Button
												variant={"outline"}
												className={cn(
													"justify-start text-left font-normal",
													!field.value && "text-muted-foreground"
												)}
												>
												<CalendarIcon className="mr-2 h-4 w-4" />
													{field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													initialFocus
												/>
											</PopoverContent>
											</Popover>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='tipo_documento'
							render={({ field }) => (
								<FormItem className='col-span-3'>
									<FormLabel>Tipo de documento</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder={'Defina o tipo de documento'} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{tipos_documento.map(({ value, label }) => {
												return <SelectItem value={value} key={value}>{label}</SelectItem>
											})}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='prazo'
							render={({ field }) => (
								<FormItem className='col-span-1'>
									<FormLabel>Prazo</FormLabel>
									<FormControl>
										<Input
											type='number'
											min={1}
											step={1}
											placeholder='30 dias'
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormCombobox
							className='col-span-4'
							name="tecnico_rf"
							label='Técnico'
							options={tecnicos}
						/>
						<FormCombobox
							className='col-span-4'
							name="coordenadoria_id"
							label='Coordenadoria'
							options={coordenadorias}
						/>
					</div>
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
