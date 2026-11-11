// Somente leitura e uso no servidor. Escritas em usuários ficam em
// services/usuario-actions.ts (server actions com checagem de permissão).
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { verificaLimite, verificaPagina } from "@/lib/utils";
import { Permissao, Usuario } from "@prisma/client";

export interface IUsuarioPaginado {
    data: Usuario[];
    total: number;
    pagina: number;
    limite: number;
}

export async function meuUsuario(id: string) {
    const usuario = await db.usuario.findUnique({ where: { id }});
    return usuario;
}

export async function retornaPermissao(id: string) {
    const usuario = await buscarUsuarioPorId(id);
    if (!usuario) return null;
    return usuario.permissao;
}

export async function buscarUsuarios(
    pagina: number,
    limite: number,
    busca?: string,
    status?: string,
    permissao?: string,
) {
    [pagina, limite] = verificaPagina(pagina, limite);
    const where = {
        ...(busca && {
            OR: [
                { nome: { contains: busca } },
                { email: { contains: busca } },
                { login: { contains: busca } },
            ],
        }),
        ...(status && {
            status: status === 'ATIVO' ? true : status === 'INATIVO' ? false : undefined,
        }),
        ...(permissao && {
            permissao: permissao as Permissao || undefined,
        }),
    }
    const total = await db.usuario.count({ where });
    if (total === 0) return { data: [], total, pagina, limite };
    [pagina, limite] = verificaLimite(pagina, limite, total);
    const usuarios = await db.usuario.findMany({
        skip: (pagina - 1) * limite,
        take: limite,
        where
    });
    return { data: usuarios, total, pagina, limite };
}

export async function validaUsuario() {
    const session = await auth();
    if (!session?.user) return null;
    const { id } = session.user;
    const usuario = await db.usuario.findUnique({ where: { id }});
    // Usuário desativado perde o acesso mesmo com sessão ainda válida
    if (!usuario || !usuario.status) return null;
    return usuario;
}

export async function buscarUsuarioPorId(id: string) {
    const usuario = await db.usuario.findUnique({ where: { id }});
    return usuario;
}
