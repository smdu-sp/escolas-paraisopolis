/** @format */

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { excluirRespostas, excluirRespostasPorFiltro } from '@/services/resposta-actions';

const PALAVRA_CONFIRMACAO = 'EXCLUIR';

interface AcoesExclusaoProps {
	selecionadas: string[];
	onLimparSelecao: () => void;
	total: number;
	escolas: { id: string; nome: string }[];
}

function plural(n: number, singular: string, pluralTxt: string) {
	return `${n} ${n === 1 ? singular : pluralTxt}`;
}

export default function AcoesExclusao({ selecionadas, onLimparSelecao, total, escolas }: AcoesExclusaoProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const escola = searchParams.get('escola') || '';
	const periodo = searchParams.get('periodo') || '';
	const temFiltro = !!(escola || periodo);

	const [modal, setModal] = useState<'selecionadas' | 'filtro' | null>(null);
	const [confirmacao, setConfirmacao] = useState('');
	const [pendente, startTransition] = useTransition();

	const nomeEscola = escolas.find((e) => e.id === escola)?.nome;
	const [inicio, fim] = periodo.split(',').map((d) => d?.replaceAll('-', '/'));
	const descricaoFiltro = [
		nomeEscola ? `escola ${nomeEscola}` : escola ? 'escola selecionada' : null,
		periodo ? `período de ${inicio || '...'} a ${fim || '...'}` : null,
	]
		.filter(Boolean)
		.join(', ');

	function fechar() {
		if (pendente) return;
		setModal(null);
		setConfirmacao('');
	}

	function excluir() {
		startTransition(async () => {
			const resp =
				modal === 'selecionadas'
					? await excluirRespostas(selecionadas)
					: await excluirRespostasPorFiltro({ escola, periodo }, total);
			if (!resp.ok) {
				toast.error(resp.erro);
				return;
			}
			toast.success(`${plural(resp.excluidas, 'resposta excluída', 'respostas excluídas')}`);
			onLimparSelecao();
			setModal(null);
			setConfirmacao('');
			router.refresh();
		});
	}

	if (total === 0) return null;

	return (
		<>
			<div className='flex flex-wrap items-center gap-2'>
				{selecionadas.length > 0 && (
					<>
						<Button variant='destructive' size='sm' onClick={() => setModal('selecionadas')}>
							<Trash2 /> Excluir {plural(selecionadas.length, 'selecionada', 'selecionadas')}
						</Button>
						<Button variant='ghost' size='sm' onClick={onLimparSelecao}>
							<X /> Limpar seleção
						</Button>
					</>
				)}
				<Button
					variant='outline'
					size='sm'
					className='text-destructive hover:text-destructive md:ml-auto'
					onClick={() => setModal('filtro')}>
					<Trash2 />
					{temFiltro
						? `Excluir todas do filtro (${total})`
						: `Excluir todas as respostas (${total})`}
				</Button>
			</div>

			<Dialog open={modal !== null} onOpenChange={(aberto) => !aberto && fechar()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{modal === 'selecionadas'
								? `Excluir ${plural(selecionadas.length, 'resposta', 'respostas')}?`
								: `Excluir ${plural(total, 'resposta', 'respostas')}?`}
						</DialogTitle>
						<DialogDescription>
							{modal === 'selecionadas'
								? 'As respostas selecionadas serão apagadas permanentemente, com todos os pontos e dados ligados a elas.'
								: temFiltro
									? `Serão apagadas permanentemente todas as respostas do filtro atual (${descricaoFiltro}), inclusive as de outras páginas da lista.`
									: 'Nenhum filtro aplicado: serão apagadas permanentemente TODAS as respostas do sistema.'}{' '}
							Essa ação não pode ser desfeita.
						</DialogDescription>
					</DialogHeader>
					{modal === 'filtro' && (
						<div className='flex flex-col gap-2'>
							<Label htmlFor='confirmacao-exclusao'>
								Para confirmar, digite <strong>{PALAVRA_CONFIRMACAO}</strong>
							</Label>
							<Input
								id='confirmacao-exclusao'
								autoComplete='off'
								value={confirmacao}
								onChange={(e) => setConfirmacao(e.target.value)}
							/>
						</div>
					)}
					<DialogFooter>
						<DialogClose asChild>
							<Button variant='outline' disabled={pendente}>
								Voltar
							</Button>
						</DialogClose>
						<Button
							variant='destructive'
							disabled={pendente || (modal === 'filtro' && confirmacao.trim().toUpperCase() !== PALAVRA_CONFIRMACAO)}
							onClick={excluir}>
							{pendente ? <Loader2 className='animate-spin' /> : <Trash2 />} Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
