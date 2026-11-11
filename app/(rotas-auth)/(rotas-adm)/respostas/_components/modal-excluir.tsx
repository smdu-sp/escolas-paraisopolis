/** @format */
'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { excluirResposta } from '@/services/resposta-actions';
import { Loader2, Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

export default function ModalExcluir({ id }: { id: string }) {
	const [isPending, startTransition] = useTransition();

	async function handleExcluir() {
		const resp = await excluirResposta(id);
		if (!resp.ok) {
			toast.error(resp.erro);
			return;
		}
		toast.success('Cadastro excluído com sucesso');
		window.location.reload();
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					size="icon"
					variant="outline"
					className="hover:bg-destructive group transition-all ease-linear duration-200"
				>
					<Trash2 size={18} className="text-destructive group-hover:text-white" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Excluir cadastro</DialogTitle>
				</DialogHeader>
				<p>Tem certeza que deseja excluir permanentemente esse cadastro? Essa ação não pode ser desfeita.</p>
				<DialogFooter>
					<div className="flex gap-2">
						<DialogClose asChild>
							<Button variant="outline">Voltar</Button>
						</DialogClose>
						<Button
							disabled={isPending}
							variant="destructive"
							onClick={() => startTransition(handleExcluir)}
						>
							{isPending ? <Loader2 className="animate-spin" /> : 'Excluir'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
