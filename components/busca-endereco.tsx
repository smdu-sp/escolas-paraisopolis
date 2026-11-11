'use client';

import { useState } from 'react';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ResultadoEndereco {
	nome: string;
	endereco: string;
	lat: number;
	lng: number;
}

interface BuscaEnderecoProps {
	onSelecionar: (resultado: ResultadoEndereco) => void;
	/** Mostra o botão "Usar minha localização". */
	permitirLocalizacaoAtual?: boolean;
	placeholder?: string;
	className?: string;
}

export function BuscaEndereco({
	onSelecionar,
	permitirLocalizacaoAtual = false,
	placeholder = 'Digite o endereço (ex.: Rua Irapará, 160)',
	className = '',
}: BuscaEnderecoProps) {
	const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
	const [texto, setTexto] = useState('');
	const [buscando, setBuscando] = useState(false);
	const [localizando, setLocalizando] = useState(false);
	const [resultados, setResultados] = useState<ResultadoEndereco[] | null>(null);

	async function buscar() {
		const q = texto.trim();
		if (q.length < 3) {
			toast.error('Digite pelo menos 3 caracteres');
			return;
		}
		setBuscando(true);
		try {
			const resp = await fetch(`${basePath}/api/geocode?q=${encodeURIComponent(q)}`);
			const json = await resp.json();
			if (!resp.ok) throw new Error(json?.error || 'Falha na busca');
			setResultados(json as ResultadoEndereco[]);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Falha na busca de endereço');
			setResultados(null);
		} finally {
			setBuscando(false);
		}
	}

	function selecionar(r: ResultadoEndereco) {
		onSelecionar(r);
		setResultados(null);
		setTexto(r.endereco);
	}

	function usarLocalizacaoAtual() {
		if (!('geolocation' in navigator)) {
			toast.error('Seu navegador não permite obter a localização');
			return;
		}
		setLocalizando(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLocalizando(false);
				onSelecionar({
					nome: 'Minha localização',
					endereco: 'Localização atual',
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				});
			},
			(err) => {
				setLocalizando(false);
				toast.error(
					err.code === err.PERMISSION_DENIED
						? 'Permissão de localização negada'
						: 'Não foi possível obter sua localização',
				);
			},
			{ enableHighAccuracy: true, timeout: 15000 },
		);
	}

	return (
		<div className={`relative flex flex-col gap-2 ${className}`}>
			<form
				className='flex gap-2'
				onSubmit={(e) => {
					e.preventDefault();
					buscar();
				}}>
				<Input
					value={texto}
					onChange={(e) => {
						setTexto(e.target.value);
						setResultados(null);
					}}
					placeholder={placeholder}
					aria-label='Endereço'
					className='flex-1'
				/>
				<Button type='submit' variant='secondary' disabled={buscando} title='Buscar endereço'>
					{buscando ? <Loader2 className='animate-spin' /> : <Search />}
					<span className='hidden sm:inline'>Buscar</span>
				</Button>
			</form>
			{permitirLocalizacaoAtual && (
				<Button
					type='button'
					variant='outline'
					className='w-fit'
					disabled={localizando}
					onClick={usarLocalizacaoAtual}>
					{localizando ? <Loader2 className='animate-spin' /> : <LocateFixed />}
					Usar minha localização atual
				</Button>
			)}
			{resultados && (
				<ul className='absolute top-11 left-0 right-0 z-[60] max-h-64 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md'>
					{resultados.length === 0 ? (
						<li className='p-3 text-sm text-muted-foreground'>
							Nenhum endereço encontrado. Tente incluir o número ou selecione direto no mapa.
						</li>
					) : (
						resultados.map((r, i) => (
							<li key={`${r.lat},${r.lng},${i}`}>
								<button
									type='button'
									className='flex w-full items-start gap-2 p-3 text-left text-sm hover:bg-accent'
									onClick={() => selecionar(r)}>
									<MapPin className='mt-0.5 size-4 shrink-0' />
									<span>
										<span className='font-medium'>{r.nome}</span>
										{r.endereco !== r.nome && (
											<span className='block text-muted-foreground'>{r.endereco}</span>
										)}
									</span>
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	);
}
