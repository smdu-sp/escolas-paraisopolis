import { db } from "@/lib/prisma";
import { verificaLimite, verificaPagina } from "@/lib/utils";

export interface IPontoResposta {
    id: string;
    tipo: "ORIGEM" | "REFERENCIA" | "REUNIAO";
    nomeLocal: string | null;
    latitude: number;
    longitude: number;
    ordem: number | null;
}

export interface IRespostaDetalhada {
    id: string;
    criadoEm: Date;
    temReuniao: boolean;
    escola: { id: string; nome: string; latitude: number; longitude: number };
    pontos: IPontoResposta[];
    qtdCriancas: number;
    transportes: { sentido: "IDA" | "VOLTA"; tipoCodigo: string; descricaoLivre: string | null }[];
    acompanhantes: { tipoCodigo: string; descricaoLivre: string | null }[];
    sentimentos: { metrica: string; nota: number }[];
    problemas: { ordem: number; texto: string }[];
    sugestoes: { ordem: number; texto: string }[];
}

export interface IRespostaPaginado {
    data: IRespostaDetalhada[];
    total: number;
    pagina: number;
    limite: number;
}

export async function buscarRespostas(
    pagina: number,
    limite: number,
    escolaId?: string,
    dataInicio?: Date,
    dataFim?: Date,
): Promise<IRespostaPaginado> {
    [pagina, limite] = verificaPagina(pagina, limite);
    const where = {
        ...(escolaId && { escolaId }),
        ...((dataInicio || dataFim) && {
            criadoEm: {
                ...(dataInicio && { gte: dataInicio }),
                ...(dataFim && { lte: dataFim }),
            },
        }),
    };
    const total = await db.resposta.count({ where });
    if (total === 0) return { data: [], total, pagina, limite };
    [pagina, limite] = verificaLimite(pagina, limite, total);
    const respostas = await db.resposta.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { criadoEm: "desc" },
        include: {
            escola: true,
            pontos: true,
            criancas: true,
            transportes: true,
            acompanhantes: true,
            sentimentos: { include: { metrica: true } },
            problemas: true,
            sugestoes: true,
        },
    });
    const data: IRespostaDetalhada[] = respostas.map((r) => ({
        id: r.id,
        criadoEm: r.criadoEm,
        temReuniao: r.temReuniao,
        escola: {
            id: r.escola.id,
            nome: r.escola.nome,
            latitude: Number(r.escola.latitude),
            longitude: Number(r.escola.longitude),
        },
        pontos: r.pontos.map((p) => ({
            id: p.id,
            tipo: p.tipo,
            nomeLocal: p.nomeLocal,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            ordem: p.ordem,
        })),
        qtdCriancas: r.criancas.length,
        transportes: r.transportes.map((t) => ({ sentido: t.sentido, tipoCodigo: t.tipoCodigo, descricaoLivre: t.descricaoLivre })),
        acompanhantes: r.acompanhantes.map((a) => ({ tipoCodigo: a.tipoCodigo, descricaoLivre: a.descricaoLivre })),
        sentimentos: r.sentimentos.map((s) => ({ metrica: s.metrica.nome, nota: s.nota })),
        problemas: r.problemas.map((p) => ({ ordem: p.ordem, texto: p.texto })),
        sugestoes: r.sugestoes.map((s) => ({ ordem: s.ordem, texto: s.texto })),
    }));
    return { data, total, pagina, limite };
}

export async function buscarEscolasComCadastro() {
    const escolas = await db.escola.findMany({
        where: { respostas: { some: {} } },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
    });
    return escolas;
}

export async function buscarPontosOrigem() {
    const pontos = await db.ponto.findMany({
        where: { tipo: "ORIGEM" },
        select: { latitude: true, longitude: true },
    });
    return pontos.map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));
}

interface IFaixaEtaria {
    faixa: string;
    quantidade: number;
}

function calculaFaixaEtaria(dataNascimento: Date): string {
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const aindaNaoFezAniversario =
        hoje.getMonth() < dataNascimento.getMonth() ||
        (hoje.getMonth() === dataNascimento.getMonth() && hoje.getDate() < dataNascimento.getDate());
    if (aindaNaoFezAniversario) idade -= 1;
    if (idade <= 3) return "0-3 anos";
    if (idade <= 6) return "4-6 anos";
    if (idade <= 10) return "7-10 anos";
    if (idade <= 14) return "11-14 anos";
    if (idade <= 17) return "15-17 anos";
    return "18+ anos";
}

export interface IRelatorios {
    totalCadastros: number;
    totalCriancas: number;
    totalComReuniao: number;
    cadastrosPorEscola: { escola: string; quantidade: number }[];
    transportePorTipo: { tipoCodigo: string; ida: number; volta: number }[];
    acompanhantesPorTipo: { tipoCodigo: string; quantidade: number }[];
    sentimentosMedios: { metrica: string; media: number }[];
    faixasEtarias: IFaixaEtaria[];
    problemasMaisCitados: { texto: string; quantidade: number }[];
    sugestoesMaisCitadas: { texto: string; quantidade: number }[];
}

export async function buscarRelatorios(): Promise<IRelatorios> {
    const [
        totalCadastros,
        totalCriancas,
        totalComReuniao,
        cadastrosPorEscolaRaw,
        escolas,
        transportesRaw,
        acompanhantesRaw,
        sentimentosRaw,
        metricas,
        criancas,
        problemasRaw,
        sugestoesRaw,
    ] = await Promise.all([
        db.resposta.count(),
        db.crianca.count(),
        db.resposta.count({ where: { temReuniao: true } }),
        db.resposta.groupBy({ by: ["escolaId"], _count: { _all: true } }),
        db.escola.findMany({ select: { id: true, nome: true } }),
        db.transporte.groupBy({ by: ["sentido", "tipoCodigo"], _count: { _all: true } }),
        db.acompanhante.groupBy({ by: ["tipoCodigo"], _count: { _all: true } }),
        db.sentimentoResposta.groupBy({ by: ["metricaId"], _avg: { nota: true } }),
        db.metricaSentimento.findMany({ select: { id: true, nome: true } }),
        db.crianca.findMany({ select: { dataNascimento: true } }),
        db.problema.groupBy({ by: ["texto"], _count: { _all: true }, orderBy: { _count: { texto: "desc" } }, take: 10 }),
        db.sugestao.groupBy({ by: ["texto"], _count: { _all: true }, orderBy: { _count: { texto: "desc" } }, take: 10 }),
    ]);

    const nomeEscolaPorId = new Map(escolas.map((e) => [e.id, e.nome]));
    const cadastrosPorEscola = cadastrosPorEscolaRaw.map((c) => ({
        escola: nomeEscolaPorId.get(c.escolaId) || "Desconhecida",
        quantidade: c._count._all,
    }));

    const transportePorTipoMap = new Map<string, { ida: number; volta: number }>();
    transportesRaw.forEach((t) => {
        const atual = transportePorTipoMap.get(t.tipoCodigo) || { ida: 0, volta: 0 };
        if (t.sentido === "IDA") atual.ida += t._count._all;
        else atual.volta += t._count._all;
        transportePorTipoMap.set(t.tipoCodigo, atual);
    });
    const transportePorTipo = Array.from(transportePorTipoMap.entries()).map(([tipoCodigo, v]) => ({ tipoCodigo, ...v }));

    const acompanhantesPorTipo = acompanhantesRaw.map((a) => ({ tipoCodigo: a.tipoCodigo, quantidade: a._count._all }));

    const nomeMetricaPorId = new Map(metricas.map((m) => [m.id, m.nome]));
    const sentimentosMedios = sentimentosRaw.map((s) => ({
        metrica: nomeMetricaPorId.get(s.metricaId) || "Desconhecida",
        media: Math.round((s._avg.nota || 0) * 10) / 10,
    }));

    const ordemFaixas = ["0-3 anos", "4-6 anos", "7-10 anos", "11-14 anos", "15-17 anos", "18+ anos"];
    const faixasMap = new Map<string, number>();
    criancas.forEach((c) => {
        const faixa = calculaFaixaEtaria(c.dataNascimento);
        faixasMap.set(faixa, (faixasMap.get(faixa) || 0) + 1);
    });
    const faixasEtarias = ordemFaixas
        .map((faixa) => ({ faixa, quantidade: faixasMap.get(faixa) || 0 }))
        .filter((f) => f.quantidade > 0);

    const problemasMaisCitados = problemasRaw.map((p) => ({ texto: p.texto, quantidade: p._count._all }));
    const sugestoesMaisCitadas = sugestoesRaw.map((s) => ({ texto: s.texto, quantidade: s._count._all }));

    return {
        totalCadastros,
        totalCriancas,
        totalComReuniao,
        cadastrosPorEscola,
        transportePorTipo,
        acompanhantesPorTipo,
        sentimentosMedios,
        faixasEtarias,
        problemasMaisCitados,
        sugestoesMaisCitadas,
    };
}
