import { listarEscolas } from "@/services/escola";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const escolas = await listarEscolas();
        return Response.json(escolas);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'erro';
        return Response.json({ error: message }, { status: 500 });
    }
}
