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

async function exigirAdmin() {
    const usuario = await validaUsuario();
    if (!usuario || !["DEV", "ADM"].includes(usuario.permissao)) {
        throw new Error("Não autorizado");
    }
}

function validar(dados: IEscolaInput) {
    const nome = dados.nome?.trim();
    if (!nome) throw new Error("Informe o nome da escola");
    const { latitude, longitude } = dados;
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error("Latitude inválida");
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Longitude inválida");
    return {
        nome,
        endereco: dados.endereco?.trim() || null,
        latitude,
        longitude,
    };
}

export async function atualizarEscola(id: string, dados: IEscolaInput) {
    await exigirAdmin();
    const data = validar(dados);
    const duplicada = await db.escola.findFirst({ where: { nome: data.nome, NOT: { id } } });
    if (duplicada) throw new Error("Já existe uma escola com esse nome");
    await db.escola.update({ where: { id }, data });
    revalidatePath("/escolas");
    revalidatePath("/respostas");
}

export async function criarEscola(dados: IEscolaInput) {
    await exigirAdmin();
    const data = validar(dados);
    const duplicada = await db.escola.findFirst({ where: { nome: data.nome } });
    if (duplicada) throw new Error("Já existe uma escola com esse nome");
    const criada = await db.escola.create({ data });
    revalidatePath("/escolas");
    return criada.id;
}
