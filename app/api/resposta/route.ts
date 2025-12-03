import { NextRequest } from "next/server";
import { db } from "@/lib/prisma";
export const runtime = 'nodejs';

type Coordenadas = { lat: number; lng: number; nomeLocal?: string };
type Sentimento = { parametro: string; valor: number };
type Problema = { ordem: number; problema: string };
type Sugestao = { ordem: number; sugestao: string };
type EscolaInfo = { nome: string; endereco?: string; lat: number; lng: number };

function mapSentimentKey(nome: string): "RUAS_CALCADAS" | "LIXO" | "ESGOTO" | "SEGURANCA" | "VELOCIDADE" | null {
  const n = nome.trim().toLowerCase();
  if (n.includes("ruas") || n.includes("calçadas") || n.includes("calcadas")) return "RUAS_CALCADAS";
  if (n.includes("lixo")) return "LIXO";
  if (n.includes("esgoto")) return "ESGOTO";
  if (n.includes("seguran")) return "SEGURANCA";
  if (n.includes("velocidade")) return "VELOCIDADE";
  return null;
}

export async function POST(
    request: NextRequest
) {
    const data = await request.json();
    const {
      escola,
      escolaInfo,
      alunos,
      transporteIda,
      transporteVolta,
      acompanhantes,
      partida,
      referencias,
      sentimentos,
      problemas,
      sugestoes,
      reuniao,
      temReuniao,
      usuarioIdOpcional,
    }: {
      escola: number;
      escolaInfo?: EscolaInfo;
      alunos: (string | Date)[];
      transporteIda: string[];
      transporteVolta: string[];
      acompanhantes: string[];
      partida?: Coordenadas;
      referencias: Coordenadas[];
      sentimentos: Sentimento[];
      problemas: Problema[];
      sugestoes: Sugestao[];
      reuniao?: Coordenadas;
      temReuniao: boolean;
      usuarioIdOpcional?: string | null;
    } = data;

    try {
      let escolaId: string | null = null;
      if (escolaInfo && escolaInfo.nome) {
        const existente = await db.escola.findFirst({ where: { nome: escolaInfo.nome } });
        if (existente) {
          escolaId = existente.id;
        } else {
          const criada = await db.escola.create({
            data: {
              nome: escolaInfo.nome,
              endereco: escolaInfo.endereco,
              latitude: escolaInfo.lat,
              longitude: escolaInfo.lng,
            },
          });
          escolaId = criada.id;
        }
      }

      if (!escolaId) {
        return new Response(JSON.stringify({ ok: false, error: 'escola não informada' }), { status: 400, headers: { 'content-type': 'application/json' } });
      }
      const resposta = await db.resposta.create({
        data: {
          escolaId: escolaId,
          temReuniao: !!temReuniao,
          usuarioIdOpcional: usuarioIdOpcional ?? undefined,
        },
      });

      const respostaId = resposta.id;

      const pontosData: Array<{
        respostaId: string;
        tipo: "ORIGEM" | "REFERENCIA" | "REUNIAO";
        nomeLocal?: string | null;
        latitude: number;
        longitude: number;
        ordem?: number | null;
      }> = [];
      if (partida && typeof partida.lat === "number" && typeof partida.lng === "number") {
        pontosData.push({
          respostaId,
          tipo: "ORIGEM",
          nomeLocal: partida.nomeLocal || null,
          latitude: partida.lat,
          longitude: partida.lng,
        });
      }
      (referencias || []).forEach((ref, i) => {
        if (typeof ref.lat === "number" && typeof ref.lng === "number") {
          pontosData.push({
            respostaId,
            tipo: "REFERENCIA",
            nomeLocal: ref.nomeLocal || null,
            latitude: ref.lat,
            longitude: ref.lng,
            ordem: i,
          });
        }
      });
      if (reuniao && typeof reuniao.lat === "number" && typeof reuniao.lng === "number") {
        pontosData.push({
          respostaId,
          tipo: "REUNIAO",
          nomeLocal: reuniao.nomeLocal || null,
          latitude: reuniao.lat,
          longitude: reuniao.lng,
        });
      }
      if (pontosData.length) {
        await db.ponto.createMany({ data: pontosData });
      }

      const criancasData = (alunos || [])
        .map((d) => {
          const dt = typeof d === "string" ? new Date(d) : d;
          return isNaN(dt as any) ? null : dt;
        })
        .filter(Boolean)
        .map((dt) => ({ respostaId, dataNascimento: dt as Date }));
      if (criancasData.length) await db.crianca.createMany({ data: criancasData });

      const transportesData: Array<{ respostaId: string; sentido: "IDA" | "VOLTA"; tipoCodigo: string; descricaoLivre?: string | null }> = [];
      (transporteIda || []).forEach((t) => transportesData.push({ respostaId, sentido: "IDA", tipoCodigo: t }));
      (transporteVolta || []).forEach((t) => transportesData.push({ respostaId, sentido: "VOLTA", tipoCodigo: t }));
      if (transportesData.length) await db.transporte.createMany({ data: transportesData });

      const acompanhantesData = (acompanhantes || []).map((a) => ({ respostaId, tipoCodigo: a }));
      if (acompanhantesData.length) await db.acompanhante.createMany({ data: acompanhantesData });

      const metricIds: Record<string, string> = {};
      for (const s of sentimentos || []) {
        const chave = mapSentimentKey(s.parametro);
        if (!chave) continue;
        if (!metricIds[chave]) {
          const found = await db.metricaSentimento.findFirst({ where: { chave } });
          if (found) metricIds[chave] = found.id;
          else {
            const created = await db.metricaSentimento.create({ data: { chave, nome: s.parametro } });
            metricIds[chave] = created.id;
          }
        }
      }
      const sentimentosData = (sentimentos || [])
        .map((s) => {
          const chave = mapSentimentKey(s.parametro);
          const metricaId = chave ? metricIds[chave] : null;
          if (!metricaId) return null;
          return { respostaId, metricaId, nota: s.valor };
        })
        .filter(Boolean) as Array<{ respostaId: string; metricaId: string; nota: number }>;
      if (sentimentosData.length) await db.sentimentoResposta.createMany({ data: sentimentosData });

      const problemasData = (problemas || []).map((p) => ({ respostaId, ordem: p.ordem, texto: p.problema }));
      if (problemasData.length) await db.problema.createMany({ data: problemasData });
      const sugestoesData = (sugestoes || []).map((s) => ({ respostaId, ordem: s.ordem, texto: s.sugestao }));
      if (sugestoesData.length) await db.sugestao.createMany({ data: sugestoesData });

      return new Response(JSON.stringify({ ok: true, id: respostaId }), { headers: { 'content-type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ ok: false, error: e?.message || 'erro' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
}