/** @format */

'use client';

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IRelatorios } from '@/services/resposta';

function GraficoBarraSimples<T>({ data, dataKey, nameKey }: { data: T[]; dataKey: keyof T & string; nameKey: keyof T & string }) {
	return (
		<ResponsiveContainer width="100%" height={260}>
			<BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
				<CartesianGrid vertical={false} stroke="var(--border)" />
				<XAxis dataKey={nameKey} tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
				<YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
				<Tooltip cursor={{ fill: 'var(--muted)' }} />
				<Bar dataKey={dataKey} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ResponsiveContainer>
	);
}

export default function Relatorios({ relatorios }: { relatorios: IRelatorios }) {
	const percentualReuniao = relatorios.totalCadastros
		? Math.round((relatorios.totalComReuniao / relatorios.totalCadastros) * 100)
		: 0;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de cadastros</CardTitle></CardHeader>
					<CardContent className="text-3xl font-bold">{relatorios.totalCadastros}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de crianças</CardTitle></CardHeader>
					<CardContent className="text-3xl font-bold">{relatorios.totalCriancas}</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cadastros com reunião</CardTitle></CardHeader>
					<CardContent className="text-3xl font-bold">{percentualReuniao}%</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card>
					<CardHeader><CardTitle className="text-base">Cadastros por escola</CardTitle></CardHeader>
					<CardContent>
						<GraficoBarraSimples data={relatorios.cadastrosPorEscola} dataKey="quantidade" nameKey="escola" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle className="text-base">Transporte utilizado</CardTitle></CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={260}>
							<BarChart data={relatorios.transportePorTipo} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
								<CartesianGrid vertical={false} stroke="var(--border)" />
								<XAxis dataKey="tipoCodigo" tick={{ fontSize: 12 }} />
								<YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
								<Tooltip cursor={{ fill: 'var(--muted)' }} />
								<Legend />
								<Bar dataKey="ida" name="Ida" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
								<Bar dataKey="volta" name="Volta" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle className="text-base">Sentimentos médios (0-10)</CardTitle></CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={260}>
							<BarChart data={relatorios.sentimentosMedios} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
								<CartesianGrid vertical={false} stroke="var(--border)" />
								<XAxis dataKey="metrica" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
								<YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
								<Tooltip cursor={{ fill: 'var(--muted)' }} />
								<Bar dataKey="media" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle className="text-base">Faixa etária das crianças</CardTitle></CardHeader>
					<CardContent>
						<GraficoBarraSimples data={relatorios.faixasEtarias} dataKey="quantidade" nameKey="faixa" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle className="text-base">Acompanhantes</CardTitle></CardHeader>
					<CardContent>
						<GraficoBarraSimples data={relatorios.acompanhantesPorTipo} dataKey="quantidade" nameKey="tipoCodigo" />
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card>
					<CardHeader><CardTitle className="text-base">Problemas mais citados</CardTitle></CardHeader>
					<CardContent>
						{relatorios.problemasMaisCitados.length === 0 ? (
							<p className="text-muted-foreground text-sm">Nenhum problema relatado ainda</p>
						) : (
							<ol className="list-decimal list-inside space-y-1 text-sm">
								{relatorios.problemasMaisCitados.map((p, i) => (
									<li key={i}>{p.texto} <span className="text-muted-foreground">({p.quantidade})</span></li>
								))}
							</ol>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader><CardTitle className="text-base">Sugestões mais citadas</CardTitle></CardHeader>
					<CardContent>
						{relatorios.sugestoesMaisCitadas.length === 0 ? (
							<p className="text-muted-foreground text-sm">Nenhuma sugestão relatada ainda</p>
						) : (
							<ol className="list-decimal list-inside space-y-1 text-sm">
								{relatorios.sugestoesMaisCitadas.map((s, i) => (
									<li key={i}>{s.texto} <span className="text-muted-foreground">({s.quantidade})</span></li>
								))}
							</ol>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
