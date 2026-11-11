"use server";

import { db } from "@/lib/prisma";
import { validaUsuario } from "@/services/usuario";
import { revalidatePath } from "next/cache";

export interface IEscolaInput {
    nome: string;
    endereco?: string | null;
    latitude: number;
    longitude: number;
}

/**
 * As ações devolvem o erro em vez de lançá-lo: em produção o Next.js troca a
 * mensagem de erros lançados em server actions por um texto genérico.
 */
export type ResultadoAcao<T = undefined> = { ok: true; dados: T } | { ok: false; erro: string };

class ErroValidacao extends Error {}

async function exigirAdmin() {
    const usuario = await validaUsuario();
    if (!usuario || !["DEV", "ADM"].includes(usuario.permissao)) {
        throw new ErroValidacao("Não autorizado");
    }
}

function validar(dados: IEscolaInput) {
    const nome = dados.nome?.trim();
    if (!nome) throw new ErroValidacao("Informe o nome da escola");
    const { latitude, longitude } = dados;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new ErroValidacao("Latitude inválida");
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new ErroValidacao("Longitude inválida");
    return {
        nome,
        endereco: dados.endereco?.trim() || null,
        latitude,
        longitude,
    };
}

async function executar<T>(acao: () => Promise<T>): Promise<ResultadoAcao<T>> {
    try {
        return { ok: true, dados: await acao() };
    } catch (e) {
        if (e instanceof ErroValidacao) return { ok: false, erro: e.message };
        console.error(e);
        return { ok: false, erro: "Erro inesperado ao salvar" };
    }
}

export async function atualizarEscola(id: string, dados: IEscolaInput) {
    return executar(async () => {
        await exigirAdmin();
        const data = validar(dados);
        const duplicada = await db.escola.findFirst({ where: { nome: data.nome, NOT: { id } } });
        if (duplicada) throw new ErroValidacao("Já existe uma escola com esse nome");
        await db.escola.update({ where: { id }, data });
        revalidatePath("/escolas");
        revalidatePath("/respostas");
        return undefined;
    });
}

export async function criarEscola(dados: IEscolaInput) {
    return executar(async () => {
        await exigirAdmin();
        const data = validar(dados);
        const duplicada = await db.escola.findFirst({ where: { nome: data.nome } });
        if (duplicada) throw new ErroValidacao("Já existe uma escola com esse nome");
        const criada = await db.escola.create({ data });
        revalidatePath("/escolas");
        return criada.id;
    });
}

export async function removerEscola(id: string) {
    return executar(async () => {
        await exigirAdmin();
        const escola = await db.escola.findUnique({
            where: { id },
            include: { _count: { select: { respostas: true } } },
        });
        if (!escola) throw new ErroValidacao("Escola não encontrada");
        const qtd = escola._count.respostas;
        if (qtd > 0) {
            throw new ErroValidacao(
                `Não é possível remover: a escola tem ${qtd} resposta${qtd > 1 ? "s" : ""} cadastrada${qtd > 1 ? "s" : ""}`,
            );
        }
        await db.escola.delete({ where: { id } });
        revalidatePath("/escolas");
        revalidatePath("/respostas");
        return undefined;
    });
}
