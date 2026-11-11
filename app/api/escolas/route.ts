import { listarEscolas } from "@/services/escola";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const escolas = await listarEscolas();
        // Rota pública: não expõe a contagem de respostas
        return Response.json(escolas.map((e) => ({
            id: e.id,
            nome: e.nome,
            endereco: e.endereco,
            latitude: e.latitude,
            longitude: e.longitude,
            legadoId: e.legadoId,
        })));
    } catch (e) {
        const message = e instanceof Error ? e.message : 'erro';
        return Response.json({ error: message }, { status: 500 });
    }
}
