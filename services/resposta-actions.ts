"use server";

import { db } from "@/lib/prisma";
import { validaUsuario } from "@/services/usuario";

export async function excluirResposta(id: string) {
    const usuarioLogado = await validaUsuario();
    if (!usuarioLogado || usuarioLogado.permissao !== "DEV") {
        throw new Error("Não autorizado");
    }
    await db.$transaction([
        db.ponto.deleteMany({ where: { respostaId: id } }),
        db.crianca.deleteMany({ where: { respostaId: id } }),
        db.transporte.deleteMany({ where: { respostaId: id } }),
        db.acompanhante.deleteMany({ where: { respostaId: id } }),
        db.sentimentoResposta.deleteMany({ where: { respostaId: id } }),
        db.problema.deleteMany({ where: { respostaId: id } }),
        db.sugestao.deleteMany({ where: { respostaId: id } }),
        db.resposta.delete({ where: { id } }),
    ]);
}
