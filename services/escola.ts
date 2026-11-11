import { db } from "@/lib/prisma";
import { ESCOLAS_PADRAO } from "@/lib/escolas-padrao";

export interface IEscola {
    id: string;
    nome: string;
    endereco: string | null;
    latitude: number;
    longitude: number;
    legadoId: number | null;
}

const TOLERANCIA = 1e-6;
let escolasGarantidas = false;

/**
 * Completa a tabela com as escolas padrão e corrige registros que ainda estão com as
 * coordenadas erradas antigas. Roda uma vez por processo.
 */
export async function garantirEscolas() {
    if (escolasGarantidas) return;
    const existentes = await db.escola.findMany();
    // Antes as escolas só eram gravadas quando recebiam a 1ª resposta, então o banco
    // pode ter só parte delas. Completa enquanto houver menos que a lista padrão
    // (depois disso, renomear uma escola no admin não a faz "reaparecer").
    if (existentes.length < ESCOLAS_PADRAO.length) {
        const faltantes = ESCOLAS_PADRAO.filter((p) => !existentes.some((e) => e.nome === p.nome));
        if (faltantes.length) {
            await db.escola.createMany({
                data: faltantes.map((e) => ({
                    nome: e.nome,
                    endereco: e.endereco,
                    latitude: e.latitude,
                    longitude: e.longitude,
                })),
            });
        }
    }
    {
        for (const padrao of ESCOLAS_PADRAO) {
            const registro = existentes.find((e) => e.nome === padrao.nome);
            if (!registro) continue;
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
    }
    escolasGarantidas = true;
}

export async function listarEscolas(): Promise<IEscola[]> {
    await garantirEscolas();
    const escolas = await db.escola.findMany({ orderBy: { nome: "asc" } });
    return escolas.map((e) => ({
        id: e.id,
        nome: e.nome,
        endereco: e.endereco,
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
        legadoId: ESCOLAS_PADRAO.find((p) => p.nome === e.nome)?.legadoId ?? null,
    }));
}
