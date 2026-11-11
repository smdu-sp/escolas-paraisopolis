/** @format */

'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useTransition } from 'react';
import { Loader2, MapPin, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BuscaEndereco } from '@/components/busca-endereco';
import { atualizarEscola, criarEscola, removerEscola } from '@/services/escola-actions';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { IEscola } from '@/services/escola';

const MapaEscolas = dynamic(() => import('./mapa-escolas'), { ssr: false });

interface EscolaEditavel {
	id: string;
	nome: string;
	endereco: string;
	latitude: number;
	longitude: number;
	qtdRespostas: number;
	nova?: boolean;
}

function paraEditavel(e: IEscola): EscolaEditavel {
	return { id: e.id, nome: e.nome, endereco: e.endereco || '', latitude: e.latitude, longitude: e.longitude, qtdRespostas: e.qtdRespostas };
}

function igual(a: EscolaEditavel, b: EscolaEditavel) {
	return (
		a.nome === b.nome &&
		a.endereco === b.endereco &&
		Math.abs(a.latitude - b.latitude) < 1e-8 &&
		Math.abs(a.longitude - b.longitude) < 1e-8
	);
}

export default function PainelEscolas({ escolasIniciais }: { escolasIniciais: IEscola[] }) {
	const [originais, setOriginais] = useState<EscolaEditavel[]>(() => escolasIniciais.map(paraEditavel));
	const [escolas, setEscolas] = useState<EscolaEditavel[]>(() => escolasIniciais.map(paraEditavel));
	const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
	const [salvando, startTransition] = useTransition();
	const [confirmarRemocao, setConfirmarRemocao] = useState(false);

	const selecionada = escolas.find((e) => e.id === selecionadaId) || null;
	const original = originais.find((e) => e.id === selecionadaId);
	const alteradas = useMemo(
		() => new Set(escolas.filter((e) => e.nova || !originais.some((o) => o.id === e.id && igual(o, e))).map((e) => e.id)),
		[escolas, originais],
	);

	function alterar(id: string, dados: Partial<EscolaEditavel>) {
		setEscolas((atual) => atual.map((e) => (e.id === id ? { ...e, ...dados } : e)));
	}

	function novaEscola() {
		const id = `nova-${Date.now()}`;
		const base = selecionada || escolas[0];
		setEscolas((atual) => [
			...atual,
			{
				id,
				nome: 'Nova escola',
				endereco: '',
				latitude: base ? base.latitude + 0.0005 : -23.6187664,
				longitude: base ? base.longitude + 0.0005 : -46.7268192,
				qtdRespostas: 0,
				nova: true,
			},
		]);
		setSelecionadaId(id);
	}

	function descartar() {
		if (!selecionada) return;
		if (selecionada.nova) {
			setEscolas((atual) => atual.filter((e) => e.id !== selecionada.id));
			setSelecionadaId(null);
		} else if (original) {
			alterar(selecionada.id, original);
		}
	}

	function salvar() {
		if (!selecionada) return;
		const dados = {
			nome: selecionada.nome,
			endereco: selecionada.endereco,
			latitude: selecionada.latitude,
			longitude: selecionada.longitude,
		};
		startTransition(async () => {
			if (selecionada.nova) {
				const resp = await criarEscola(dados);
				if (!resp.ok) return void toast.error(resp.erro);
				const salva = { ...selecionada, ...dados, id: resp.dados, nova: undefined };
				setEscolas((atual) => atual.map((e) => (e.id === selecionada.id ? salva : e)));
				setOriginais((atual) => [...atual, salva]);
				setSelecionadaId(resp.dados);
			} else {
				const resp = await atualizarEscola(selecionada.id, dados);
				if (!resp.ok) return void toast.error(resp.erro);
				setOriginais((atual) => atual.map((e) => (e.id === selecionada.id ? { ...selecionada } : e)));
			}
			toast.success('Escola salva');
		});
	}

	function remover() {
		if (!selecionada || selecionada.nova) return;
		const { id, nome } = selecionada;
		startTransition(async () => {
			const resp = await removerEscola(id);
			setConfirmarRemocao(false);
			if (!resp.ok) return void toast.error(resp.erro);
			setEscolas((atual) => atual.filter((e) => e.id !== id));
			setOriginais((atual) => atual.filter((e) => e.id !== id));
			setSelecionadaId(null);
			toast.success(`Escola "${nome}" removida`);
		});
	}

	return (
		<div className='grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:h-[calc(100vh-10rem)]'>
			<div className='flex flex-col gap-4 lg:overflow-auto order-2 lg:order-1'>
				<div className='rounded-md border bg-background'>
					<div className='flex items-center justify-between p-3 border-b'>
						<span className='font-semibold'>{escolas.length} escolas</span>
						<Button size='sm' variant='outline' onClick={novaEscola}>
							<Plus /> Nova escola
						</Button>
					</div>
					<ul className='max-h-72 overflow-auto'>
						{escolas.map((e) => (
							<li key={e.id}>
								<button
									type='button'
									onClick={() => setSelecionadaId(e.id)}
									className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${e.id === selecionadaId ? 'bg-accent' : ''}`}>
									<MapPin className='mt-0.5 size-4 shrink-0 text-primary' />
									<span className='flex-1'>
										<span className='font-medium'>{e.nome}</span>
										{e.endereco && <span className='block text-muted-foreground'>{e.endereco}</span>}
										{!e.nova && (
											<span className='block text-xs text-muted-foreground'>
												{e.qtdRespostas} resposta{e.qtdRespostas === 1 ? '' : 's'}
											</span>
										)}
									</span>
									{alteradas.has(e.id) && <Badge variant='secondary'>não salvo</Badge>}
								</button>
							</li>
						))}
					</ul>
				</div>

				{selecionada ? (
					<div className='rounded-md border bg-background p-4 flex flex-col gap-3'>
						<p className='text-sm text-muted-foreground'>
							Arraste o pin no mapa, clique no ponto correto, busque o endereço ou digite as coordenadas.
						</p>
						<div className='flex flex-col gap-1.5'>
							<Label htmlFor='escola-nome'>Nome</Label>
							<Input id='escola-nome' value={selecionada.nome} onChange={(e) => alterar(selecionada.id, { nome: e.target.value })} />
						</div>
						<div className='flex flex-col gap-1.5'>
							<Label htmlFor='escola-endereco'>Endereço</Label>
							<Input id='escola-endereco' value={selecionada.endereco} onChange={(e) => alterar(selecionada.id, { endereco: e.target.value })} />
						</div>
						<div className='flex flex-col gap-1.5'>
							<Label>Posicionar pelo endereço</Label>
							<BuscaEndereco
								placeholder='Buscar endereço para mover o pin'
								onSelecionar={(r) => alterar(selecionada.id, { latitude: r.lat, longitude: r.lng })}
							/>
						</div>
						<div className='grid grid-cols-2 gap-2'>
							<div className='flex flex-col gap-1.5'>
								<Label htmlFor='escola-lat'>Latitude</Label>
								<Input
									id='escola-lat'
									type='number'
									step='0.000001'
									value={selecionada.latitude}
									onChange={(e) => e.target.value !== '' && alterar(selecionada.id, { latitude: Number(e.target.value) })}
								/>
							</div>
							<div className='flex flex-col gap-1.5'>
								<Label htmlFor='escola-lng'>Longitude</Label>
								<Input
									id='escola-lng'
									type='number'
									step='0.000001'
									value={selecionada.longitude}
									onChange={(e) => e.target.value !== '' && alterar(selecionada.id, { longitude: Number(e.target.value) })}
								/>
							</div>
						</div>
						{!selecionada.nova && (
							<div className='flex flex-col gap-1.5 border-t pt-3'>
								<Button
									variant='outline'
									className='w-fit text-destructive hover:text-destructive'
									disabled={salvando || selecionada.qtdRespostas > 0}
									onClick={() => setConfirmarRemocao(true)}>
									<Trash2 /> Remover escola
								</Button>
								{selecionada.qtdRespostas > 0 && (
									<p className='text-xs text-muted-foreground'>
										Não pode ser removida: tem {selecionada.qtdRespostas} resposta{selecionada.qtdRespostas > 1 ? 's' : ''} cadastrada
										{selecionada.qtdRespostas > 1 ? 's' : ''}.
									</p>
								)}
							</div>
						)}
						<div className='flex justify-between gap-2'>
							<Button variant='outline' onClick={descartar} disabled={salvando || !alteradas.has(selecionada.id)}>
								<RotateCcw /> {selecionada.nova ? 'Cancelar' : 'Desfazer'}
							</Button>
							<Button onClick={salvar} disabled={salvando || !alteradas.has(selecionada.id)}>
								{salvando ? <Loader2 className='animate-spin' /> : <Save />} Salvar
							</Button>
						</div>
					</div>
				) : (
					<p className='text-sm text-muted-foreground'>Selecione uma escola na lista ou no mapa para conferir e editar a localização.</p>
				)}
			</div>
			<AlertDialog open={confirmarRemocao} onOpenChange={(aberto) => !salvando && setConfirmarRemocao(aberto)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remover escola?</AlertDialogTitle>
						<AlertDialogDescription>
							A escola <strong>{selecionada?.nome}</strong> deixará de aparecer no formulário e no mapa. Essa ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							className='bg-destructive text-white hover:bg-destructive/90'
							disabled={salvando}
							onClick={(e) => {
								e.preventDefault();
								remover();
							}}>
							{salvando ? <Loader2 className='animate-spin' /> : <Trash2 />} Remover
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<div className='h-[60vh] lg:h-full order-1 lg:order-2'>
				<MapaEscolas
					escolas={escolas}
					selecionadaId={selecionadaId}
					onSelecionar={setSelecionadaId}
					onMover={(id, latitude, longitude) =>
						alterar(id, { latitude: Number(latitude.toFixed(7)), longitude: Number(longitude.toFixed(7)) })
					}
				/>
			</div>
		</div>
	);
}
