/**
 * Atualiza a posição (e o endereço) das escolas usando o Prisma.
 * Os valores vêm de lib/escolas-padrao.ts (conferidos no OpenStreetMap, nov/2026).
 *
 *   * escolas existentes são atualizadas pelo nome (os ids não mudam, então as
 *     respostas já gravadas continuam ligadas às mesmas escolas);
 *   * escolas que ainda não existem são criadas.
 *
 * Por padrão só MOSTRA o que mudaria. Para gravar, passe --aplicar:
 *
 *   npm run db:escolas                 # simulação
 *   npm run db:escolas -- --aplicar    # grava
 *
 * Usa o DATABASE_URL do .env. Para produção, aponte para o banco de produção:
 *   DATABASE_URL="mysql://usuario:senha@host:3306/banco" npm run db:escolas -- --aplicar
 *   (PowerShell: $env:DATABASE_URL="mysql://..."; npm run db:escolas -- --aplicar)
 */
import { PrismaClient } from '@prisma/client';
import { ESCOLAS_PADRAO } from '../lib/escolas-padrao';

const prisma = new PrismaClient();
const aplicar = process.argv.includes('--aplicar');
const TOLERANCIA = 1e-7;

function hostDoBanco() {
    try {
        const url = new URL(process.env.DATABASE_URL || '');
        return `${url.hostname}${url.pathname}`;
    } catch {
        return '(DATABASE_URL inválido ou ausente)';
    }
}

async function main() {
    console.log(`Banco: ${hostDoBanco()}`);
    console.log(aplicar ? 'Modo: APLICAR (vai gravar)\n' : 'Modo: simulação (nada será gravado; use --aplicar)\n');

    const existentes = await prisma.escola.findMany();
    const operacoes = [];
    let inalteradas = 0;

    for (const padrao of ESCOLAS_PADRAO) {
        const atual = existentes.find((e) => e.nome === padrao.nome);
        if (!atual) {
            console.log(`+ CRIAR      ${padrao.nome}  (${padrao.latitude}, ${padrao.longitude})`);
            operacoes.push(
                prisma.escola.create({
                    data: {
                        nome: padrao.nome,
                        endereco: padrao.endereco,
                        latitude: padrao.latitude,
                        longitude: padrao.longitude,
                    },
                }),
            );
            continue;
        }

        const lat = Number(atual.latitude);
        const lng = Number(atual.longitude);
        const mudouPosicao =
            Math.abs(lat - padrao.latitude) > TOLERANCIA || Math.abs(lng - padrao.longitude) > TOLERANCIA;
        const mudouEndereco = (atual.endereco ?? null) !== padrao.endereco;
        if (!mudouPosicao && !mudouEndereco) {
            inalteradas++;
            continue;
        }

        console.log(`~ ATUALIZAR  ${padrao.nome}`);
        if (mudouPosicao) console.log(`    posição:  (${lat}, ${lng})  ->  (${padrao.latitude}, ${padrao.longitude})`);
        if (mudouEndereco) console.log(`    endereço: ${atual.endereco ?? '(vazio)'}  ->  ${padrao.endereco ?? '(vazio)'}`);
        operacoes.push(
            prisma.escola.update({
                where: { id: atual.id },
                data: { endereco: padrao.endereco, latitude: padrao.latitude, longitude: padrao.longitude },
            }),
        );
    }

    const outras = existentes.filter((e) => !ESCOLAS_PADRAO.some((p) => p.nome === e.nome));
    for (const e of outras) console.log(`= IGNORADA   ${e.nome} (não está na lista padrão, não foi alterada)`);

    console.log(`\n${operacoes.length} alteração(ões), ${inalteradas} já corretas.`);

    if (!operacoes.length) return;
    if (!aplicar) {
        console.log('Simulação concluída. Rode novamente com --aplicar para gravar.');
        return;
    }
    await prisma.$transaction(operacoes);
    console.log('Alterações gravadas.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
