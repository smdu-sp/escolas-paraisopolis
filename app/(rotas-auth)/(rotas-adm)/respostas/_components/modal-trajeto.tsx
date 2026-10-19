/** @format */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapPin } from 'lucide-react';
import { IRespostaDetalhada } from '@/services/resposta';

const MapaTrajeto = dynamic(() => import('./mapa-trajeto'), { ssr: false });

export default function ModalTrajeto({ resposta }: { resposta: IRespostaDetalhada }) {
	const [open, setOpen] = useState(false);
	const isMobile = useIsMobile();

	const conteudo = (
		<div className="space-y-4">
			<div className="h-[320px] w-full">
				<MapaTrajeto escola={resposta.escola} pontos={resposta.pontos} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
				<div>
					<h4 className="font-semibold mb-1">Transporte</h4>
					{resposta.transportes.length === 0 && <p className="text-muted-foreground">Nenhum informado</p>}
					<div className="flex flex-wrap gap-1">
						{resposta.transportes.map((t, i) => (
							<Badge key={i} variant="outline">
								{t.sentido === 'IDA' ? 'Ida' : 'Volta'}: {t.tipoCodigo}
							</Badge>
						))}
					</div>
				</div>
				<div>
					<h4 className="font-semibold mb-1">Acompanhantes</h4>
					{resposta.acompanhantes.length === 0 && <p className="text-muted-foreground">Nenhum informado</p>}
					<div className="flex flex-wrap gap-1">
						{resposta.acompanhantes.map((a, i) => (
							<Badge key={i} variant="outline">{a.tipoCodigo}</Badge>
						))}
					</div>
				</div>
				<div>
					<h4 className="font-semibold mb-1">Sentimentos (0-10)</h4>
					<div className="flex flex-wrap gap-1">
						{resposta.sentimentos.map((s, i) => (
							<Badge key={i} variant="secondary">{s.metrica}: {s.nota}</Badge>
						))}
					</div>
				</div>
				<div>
					<h4 className="font-semibold mb-1">Nº de crianças</h4>
					<p>{resposta.qtdCriancas}</p>
				</div>
				{resposta.problemas.length > 0 && (
					<div className="md:col-span-2">
						<h4 className="font-semibold mb-1">Problemas relatados</h4>
						<ul className="list-disc list-inside text-muted-foreground">
							{resposta.problemas.map((p) => <li key={p.ordem}>{p.texto}</li>)}
						</ul>
					</div>
				)}
				{resposta.sugestoes.length > 0 && (
					<div className="md:col-span-2">
						<h4 className="font-semibold mb-1">Sugestões</h4>
						<ul className="list-disc list-inside text-muted-foreground">
							{resposta.sugestoes.map((s) => <li key={s.ordem}>{s.texto}</li>)}
						</ul>
					</div>
				)}
			</div>
		</div>
	);

	const titulo = `Trajeto - ${resposta.escola.nome}`;
	const descricao = new Date(resposta.criadoEm).toLocaleString('pt-BR');

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={setOpen}>
				<Button size="icon" variant="outline" onClick={() => setOpen(true)}>
					<MapPin size={18} />
				</Button>
				<DrawerContent className="h-[85vh] max-h-[85vh]">
					<DrawerHeader className="text-left">
						<DrawerTitle>{titulo}</DrawerTitle>
						<DrawerDescription>{descricao}</DrawerDescription>
					</DrawerHeader>
					<div className="px-4 pb-8 overflow-y-auto">{conteudo}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Button size="icon" variant="outline" onClick={() => setOpen(true)}>
				<MapPin size={18} />
			</Button>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{titulo}</DialogTitle>
					<DialogDescription>{descricao}</DialogDescription>
				</DialogHeader>
				{conteudo}
			</DialogContent>
		</Dialog>
	);
}
