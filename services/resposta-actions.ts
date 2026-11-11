"use server";

import { db } from "@/lib/prisma";
import { validaUsuario } from "@/services/usuario";
import { interpretarFiltroRespostas, montarFiltroRespostas } from "@/services/resposta";
import { revalidatePath } from "next/cache";

/**
 * As ações devolvem o erro em vez de lançá-lo: em produção o Next.js troca a
 * mensagem de erros lançados em server actions por um texto genérico.
 */
export type ResultadoExclusao = { ok: true; excluidas: number } | { ok: false; erro: string };

const LIMITE_POR_LOTE = 1000;

async function ehDev() {
    const usuarioLogado = await validaUsuario();
    return !!usuarioLogado && usuarioLogado.permissao === "DEV";
}

/** Apaga as respostas e todos os registros filhos, numa transação. */
async function apagarRespostas(ids: string[]) {
    if (!ids.length) return 0;
    const where = { respostaId: { in: ids } };
    const [, , , , , , , respostas] = await db.$transaction([
        db.ponto.deleteMany({ where }),
        db.crianca.deleteMany({ where }),
        db.transporte.deleteMany({ where }),
        db.acompanhante.deleteMany({ where }),
        db.sentimentoResposta.deleteMany({ where }),
        db.problema.deleteMany({ where }),
        db.sugestao.deleteMany({ where }),
        db.resposta.deleteMany({ where: { id: { in: ids } } }),
    ]);
    revalidatePath("/respostas");
    revalidatePath("/escolas");
    return respostas.count;
}

class ErroExclusao extends Error {}

async function executar(acao: () => Promise<number>): Promise<ResultadoExclusao> {
    try {
        if (!(await ehDev())) return { ok: false, erro: "Apenas desenvolvedores podem excluir respostas" };
        return { ok: true, excluidas: await acao() };
    } catch (e) {
        if (e instanceof ErroExclusao) return { ok: false, erro: e.message };
        console.error(e);
        return { ok: false, erro: "Erro inesperado ao excluir" };
    }
}

export async function excluirResposta(id: string) {
    return executar(() => apagarRespostas([id]));
}

export async function excluirRespostas(ids: string[]): Promise<ResultadoExclusao> {
    const unicos = [...new Set((ids || []).filter((id) => typeof id === "string" && id))];
    if (unicos.length > LIMITE_POR_LOTE) {
        return { ok: false, erro: `Selecione no máximo ${LIMITE_POR_LOTE} respostas por vez` } satisfies ResultadoExclusao;
    }
    return executar(() => apagarRespostas(unicos));
}

/**
 * Exclui todas as respostas que batem com o filtro da tela (escola + período).
 * `totalConfirmado` é a quantidade que o usuário viu na confirmação: se o número
 * mudou nesse meio-tempo (ex.: chegou resposta nova), nada é apagado.
 */
export async function excluirRespostasPorFiltro(
    filtro: { escola?: string; periodo?: string },
    totalConfirmado: number,
): Promise<ResultadoExclusao> {
    return executar(async () => {
        const { escolaId, dataInicio, dataFim } = interpretarFiltroRespostas(filtro.escola, filtro.periodo);
        const where = montarFiltroRespostas(escolaId, dataInicio, dataFim);
        const ids = (await db.resposta.findMany({ where, select: { id: true } })).map((r) => r.id);
        if (ids.length !== totalConfirmado) {
            throw new ErroExclusao(
                `O total de respostas do filtro mudou (agora são ${ids.length}). Recarregue a página e confirme de novo.`,
            );
        }
        return apagarRespostas(ids);
    });
}
