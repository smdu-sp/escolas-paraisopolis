/**
 * Escolas usadas para popular a tabela `escolas` quando ela está vazia.
 *
 * Coordenadas conferidas no OpenStreetMap (nov/2026). `coordenadasAntigas` guarda
 * os valores errados que estavam fixos no formulário, para que registros já
 * gravados com eles sejam corrigidos automaticamente (ver services/escola.ts).
 *
 * `legadoId` é o id numérico usado pelo formulário antigo (salvo no localStorage
 * de quem já tinha começado a responder).
 */
export interface EscolaPadrao {
    legadoId: number;
    nome: string;
    endereco: string | null;
    latitude: number;
    longitude: number;
    coordenadasAntigas: { latitude: number; longitude: number };
}

export const ESCOLAS_PADRAO: EscolaPadrao[] = [
    {
        legadoId: 1,
        nome: 'CEI Anglicana Morumbi',
        endereco: 'R. Dr. José Pedro de Carvalho Lima, 333',
        latitude: -23.6219317,
        longitude: -46.7297056,
        coordenadasAntigas: { latitude: -23.6219854, longitude: -46.7321158 },
    },
    {
        legadoId: 2,
        nome: 'CEMEI Irapará',
        endereco: 'R. Irapará, 160',
        latitude: -23.6220561,
        longitude: -46.7244561,
        coordenadasAntigas: { latitude: -23.6221082, longitude: -46.7271946 },
    },
    {
        // Não consta no OpenStreetMap: posição aproximada, conferir na tela de Escolas.
        legadoId: 3,
        nome: 'CEMEI Morumbi',
        endereco: 'R. Dr. José Pedro de Carvalho Lima, 150',
        latitude: -23.6217,
        longitude: -46.7293,
        coordenadasAntigas: { latitude: -23.6215163, longitude: -46.7319 },
    },
    {
        legadoId: 4,
        nome: 'EMEI Perimetral',
        endereco: 'R. Independência, 701',
        latitude: -23.6208798,
        longitude: -46.7241112,
        coordenadasAntigas: { latitude: -23.620817, longitude: -46.7267886 },
    },
    {
        legadoId: 5,
        nome: 'EMEF Perimetral',
        endereco: 'Av. Hebe Camargo, 299',
        latitude: -23.6186828,
        longitude: -46.7217645,
        coordenadasAntigas: { latitude: -23.6182211, longitude: -46.7244036 },
    },
    {
        // Dentro do CEU Paraisópolis (centro do lote: -23.6228548, -46.7277630).
        legadoId: 6,
        nome: 'EMEI CEU Paraisópolis',
        endereco: 'R. Dr. José Augusto de Souza e Silva, S/N',
        latitude: -23.6226,
        longitude: -46.7274,
        coordenadasAntigas: { latitude: -23.6222412, longitude: -46.7298498 },
    },
    {
        legadoId: 7,
        nome: 'EMEF CEU Paraisópolis',
        endereco: 'R. Dr. José Augusto de Souza e Silva, S/N',
        latitude: -23.6231,
        longitude: -46.7281,
        coordenadasAntigas: { latitude: -23.6228409, longitude: -46.73 },
    },
    {
        legadoId: 8,
        nome: 'EMEF Dom Veremundo Toth',
        endereco: 'R. Dr. José Pedro de Carvalho Lima, 100',
        latitude: -23.6223046,
        longitude: -46.7287146,
        coordenadasAntigas: { latitude: -23.6223, longitude: -46.7312 },
    },
    {
        legadoId: 9,
        nome: 'CEI Indireto (Monsenhor Jonas Abib)',
        endereco: null,
        latitude: -23.6054874,
        longitude: -46.7259589,
        coordenadasAntigas: { latitude: -23.6054007, longitude: -46.7286106 },
    },
];
