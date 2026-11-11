"use server";

import { db } from "@/lib/prisma";
import { validaUsuario } from "@/services/usuario";
import { revalidatePath } from "next/cache";
import type { Permissao, Usuario } from "@prisma/client";

/**
 * Secretarias (atributo `company` do AD) aceitas na busca de usuários no serviço
 * de autenticação (smul-auth). Pode ser sobrescrito por AUTH_SECRETARIAS no .env.
 */
const SECRETARIAS_PADRAO = "SMUL,SPURBANISMO";

export interface IUsuarioLdap {
    nome: string;
    email: string;
    login: string;
}

export type ResultadoBuscaLdap = { ok: true; dados: IUsuarioLdap } | { ok: false; erro: string };

function secretarias() {
    return (process.env.AUTH_SECRETARIAS || SECRETARIAS_PADRAO)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(",");
}

export async function buscarUsuarioNoLdap(login: string): Promise<ResultadoBuscaLdap> {
    const usuarioLogado = await validaUsuario();
    if (!usuarioLogado || usuarioLogado.permissao !== "DEV") {
        return { ok: false, erro: "Não autorizado" };
    }
    const loginLimpo = (login || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(loginLimpo)) {
        return { ok: false, erro: "Login inválido" };
    }
    if (!process.env.AUTH_SERVER) {
        return { ok: false, erro: "AUTH_SERVER não configurado" };
    }

    // AUTH_SERVER é a mesma base usada no login (auth/config.ts): ".../auth/"
    const base = process.env.AUTH_SERVER.endsWith("/") ? process.env.AUTH_SERVER : `${process.env.AUTH_SERVER}/`;
    const url = new URL(`ldap/buscar-por-login/${encodeURIComponent(loginLimpo)}`, base);
    url.searchParams.set("secretarias", secretarias());

    try {
        const resp = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (resp.status === 404) {
            return { ok: false, erro: `Usuário não encontrado nas secretarias ${secretarias().replaceAll(",", ", ")}` };
        }
        if (!resp.ok) {
            console.error("buscar-por-login", resp.status, await resp.text().catch(() => ""));
            return { ok: false, erro: "Serviço de autenticação indisponível" };
        }
        const usuario = (await resp.json()) as Partial<IUsuarioLdap>;
        if (!usuario?.login) return { ok: false, erro: "Usuário não encontrado" };

        const existente = await db.usuario.findFirst({
            where: { OR: [{ login: usuario.login }, ...(usuario.email ? [{ email: usuario.email }] : [])] },
        });
        if (existente) return { ok: false, erro: `Usuário já cadastrado (${existente.nome})` };

        return {
            ok: true,
            dados: { nome: usuario.nome || "", email: usuario.email || "", login: usuario.login },
        };
    } catch (e) {
        console.error("buscar-por-login", e);
        return { ok: false, erro: "Não foi possível consultar o serviço de autenticação" };
    }
}

// ---------------------------------------------------------------------------
// Escrita em usuários. Tudo passa por aqui (server actions) com checagem de
// permissão no servidor: criar / mudar permissão / ativar-desativar só DEV;
// perfil só o próprio usuário e só campos não sensíveis.
// ---------------------------------------------------------------------------

export type ResultadoUsuario = { ok: true; dados: Usuario } | { ok: false; erro: string };

const PERMISSOES: Permissao[] = ["DEV", "ADM"];

async function exigirDev() {
    const usuario = await validaUsuario();
    if (!usuario || !usuario.status || usuario.permissao !== "DEV") return null;
    return usuario;
}

export async function criarUsuario(dados: {
    nome: string;
    email: string;
    login: string;
    permissao: Permissao;
}): Promise<ResultadoUsuario> {
    if (!(await exigirDev())) return { ok: false, erro: "Não autorizado" };
    const nome = dados.nome?.trim();
    const email = dados.email?.trim().toLowerCase();
    const login = dados.login?.trim().toLowerCase();
    if (!nome || !email || !login) return { ok: false, erro: "Busque o usuário pelo login antes de salvar" };
    if (!PERMISSOES.includes(dados.permissao)) return { ok: false, erro: "Permissão inválida" };
    const existente = await db.usuario.findFirst({ where: { OR: [{ login }, { email }] } });
    if (existente) return { ok: false, erro: `Usuário já cadastrado (${existente.nome})` };
    try {
        const usuario = await db.usuario.create({ data: { nome, email, login, permissao: dados.permissao } });
        revalidatePath("/usuarios");
        return { ok: true, dados: usuario };
    } catch (e) {
        console.error("criarUsuario", e);
        return { ok: false, erro: "Erro ao criar usuário" };
    }
}

export async function alterarPermissaoUsuario(id: string, permissao: Permissao): Promise<ResultadoUsuario> {
    const dev = await exigirDev();
    if (!dev) return { ok: false, erro: "Não autorizado" };
    if (!PERMISSOES.includes(permissao)) return { ok: false, erro: "Permissão inválida" };
    if (dev.id === id && permissao !== "DEV") {
        return { ok: false, erro: "Você não pode remover a sua própria permissão de desenvolvedor" };
    }
    try {
        const usuario = await db.usuario.update({ where: { id }, data: { permissao } });
        revalidatePath("/usuarios");
        return { ok: true, dados: usuario };
    } catch (e) {
        console.error("alterarPermissaoUsuario", e);
        return { ok: false, erro: "Erro ao atualizar usuário" };
    }
}

export async function alterarStatusUsuario(id: string, status: boolean): Promise<ResultadoUsuario> {
    const dev = await exigirDev();
    if (!dev) return { ok: false, erro: "Não autorizado" };
    if (dev.id === id && !status) return { ok: false, erro: "Você não pode desativar o seu próprio usuário" };
    try {
        const usuario = await db.usuario.update({ where: { id }, data: { status: !!status } });
        revalidatePath("/usuarios");
        return { ok: true, dados: usuario };
    } catch (e) {
        console.error("alterarStatusUsuario", e);
        return { ok: false, erro: "Erro ao atualizar usuário" };
    }
}

/** Perfil do próprio usuário logado: só nome e avatar (nunca permissão/login/status). */
export async function atualizarMeuPerfil(dados: { nome?: string; avatar?: string }): Promise<ResultadoUsuario> {
    const usuario = await validaUsuario();
    if (!usuario || !usuario.status) return { ok: false, erro: "Não autorizado" };
    const data: { nome?: string; avatar?: string } = {};
    if (dados.nome !== undefined) {
        const nome = dados.nome.trim();
        if (nome.length < 2 || nome.length > 191) return { ok: false, erro: "Nome inválido" };
        data.nome = nome;
    }
    if (dados.avatar !== undefined) {
        const avatar = dados.avatar.trim();
        try {
            const url = new URL(avatar);
            if (!["http:", "https:"].includes(url.protocol) || avatar.length > 191) throw new Error();
        } catch {
            return { ok: false, erro: "URL de imagem inválida" };
        }
        data.avatar = avatar;
    }
    try {
        const atualizado = await db.usuario.update({ where: { id: usuario.id }, data });
        revalidatePath("/perfil");
        return { ok: true, dados: atualizado };
    } catch (e) {
        console.error("atualizarMeuPerfil", e);
        return { ok: false, erro: "Erro ao atualizar perfil" };
    }
}
