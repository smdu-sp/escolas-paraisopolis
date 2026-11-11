import { db } from "@/lib/prisma";
import { ESCOLAS_PADRAO, escolaPadraoPorNome } from "@/lib/escolas-padrao";

export interface IEscola {
    id: string;
    nome: string;
    endereco: string | null;
    latitude: number;
    longitude: number;
    legadoId: number | null;
    qtdRespostas: number;
}

const TOLERANCIA = 1e-6;
let escolasGarantidas = false;

/**
 * Popula a tabela com as escolas padrão quando ela está vazia e corrige registros
 * que ainda estão com as coordenadas erradas antigas. Roda uma vez por processo.
 *
 * Só cria escolas com a tabela vazia: assim uma escola removida no admin não
 * "reaparece". Para completar um banco que tem só parte das escolas, use
 * `npm run db:escolas` (scripts/atualizar-posicao-escolas.ts).
 */
export async function garantirEscolas() {
    if (escolasGarantidas) return;
    const existentes = await db.escola.findMany();
    if (existentes.length === 0) {
        await db.escola.createMany({
            data: ESCOLAS_PADRAO.map((e) => ({
                nome: e.nome,
                endereco: e.endereco,
                latitude: e.latitude,
                longitude: e.longitude,
            })),
        });
    }
    for (const registro of existentes) {
        const padrao = escolaPadraoPorNome(registro.nome);
        if (!padrao?.coordenadasAntigas) continue;
        const comCoordenadaAntiga =
            Math.abs(Number(registro.latitude) - padrao.coordenadasAntigas.latitude) < TOLERANCIA &&
            Math.abs(Number(registro.longitude) - padrao.coordenadasAntigas.longitude) < TOLERANCIA;
        if (comCoordenadaAntiga) {
            await db.escola.update({
                where: { id: registro.id },
                data: { latitude: padrao.latitude, longitude: padrao.longitude },
            });
        }
    }
    escolasGarantidas = true;
}

export async function listarEscolas(): Promise<IEscola[]> {
    await garantirEscolas();
    const escolas = await db.escola.findMany({
        orderBy: { nome: "asc" },
        include: { _count: { select: { respostas: true } } },
    });
    return escolas.map((e) => ({
        id: e.id,
        nome: e.nome,
        endereco: e.endereco,
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
        legadoId: escolaPadraoPorNome(e.nome)?.legadoId ?? null,
        qtdRespostas: e._count.respostas,
    }));
}
