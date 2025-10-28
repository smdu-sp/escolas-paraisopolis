import { atualizarUsuario } from "@/services/usuario";
import { NextRequest } from "next/server";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const data = await request.json();
    const usuarioAtualizado = await atualizarUsuario(id, data);
    if (!usuarioAtualizado) return Response.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    return Response.json(usuarioAtualizado);
}   