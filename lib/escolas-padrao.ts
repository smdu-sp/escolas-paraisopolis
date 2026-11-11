/**
 * Lista oficial de unidades (planilha "Unidades_Caminhos Escolares.xlsx", nov/2026).
 * Usada para popular a tabela `escolas` quando vazia e pelo script
 * `npm run db:escolas` (scripts/atualizar-posicao-escolas.ts).
 *
 * Coordenadas conferidas no OpenStreetMap (nov/2026). `aproximada: true` indica
 * que o local exato não consta no OSM — conferir na tela de Escolas do admin.
 *
 * `nomesAnteriores`: nomes com que a escola já foi gravada no banco, para que ela
 * seja renomeada em vez de duplicada.
 * `coordenadasAntigas`: valores errados que estavam fixos no formulário antigo;
 * registros ainda com eles são corrigidos automaticamente (services/escola.ts).
 * `legadoId`: id numérico do formulário antigo (salvo no localStorage de quem já
 * tinha começado a responder).
 */
export interface EscolaPadrao {
    nome: string;
    endereco: string | null;
    latitude: number;
    longitude: number;
    aproximada?: boolean;
    nomesAnteriores?: string[];
    legadoId?: number;
    coordenadasAntigas?: { latitude: number; longitude: number };
}

export const ESCOLAS_PADRAO: EscolaPadrao[] = [
    // --- já cadastradas antes da planilha ---
    {
        nome: 'CEI Anglicana Morumbi',
        endereco: 'R. José Pedro de Carvalho Lima, 333 - Paraisópolis',
        latitude: -23.6219317,
        longitude: -46.7297056,
        legadoId: 1,
        coordenadasAntigas: { latitude: -23.6219854, longitude: -46.7321158 },
    },
    {
        nome: 'CEMEI Irapará',
        endereco: 'R. Irapará, 160 - Paraisópolis',
        latitude: -23.6220561,
        longitude: -46.7244561,
        legadoId: 2,
        coordenadasAntigas: { latitude: -23.6221082, longitude: -46.7271946 },
    },
    {
        nome: 'CEMEI Morumbi',
        endereco: 'R. José Pedro de Carvalho Lima, 150 - Paraisópolis',
        latitude: -23.6217,
        longitude: -46.7293,
        aproximada: true,
        legadoId: 3,
        coordenadasAntigas: { latitude: -23.6215163, longitude: -46.7319 },
    },
    {
        nome: 'EMEI Perimetral I',
        nomesAnteriores: ['EMEI Perimetral'],
        endereco: 'Rua Independência, 701 - Paraisópolis',
        latitude: -23.6208798,
        longitude: -46.7241112,
        legadoId: 4,
        coordenadasAntigas: { latitude: -23.620817, longitude: -46.7267886 },
    },
    {
        nome: 'EMEF Perimetral I',
        nomesAnteriores: ['EMEF Perimetral'],
        endereco: 'Av. Hebe Camargo, 299 - Paraisópolis',
        latitude: -23.6186828,
        longitude: -46.7217645,
        legadoId: 5,
        coordenadasAntigas: { latitude: -23.6182211, longitude: -46.7244036 },
    },
    {
        nome: 'CEU EMEI Paraisópolis',
        nomesAnteriores: ['EMEI CEU Paraisópolis'],
        endereco: 'R. Dr. José Augusto de Souza e Silva, S/N - Paraisópolis',
        latitude: -23.6226,
        longitude: -46.7274,
        aproximada: true, // dentro do lote do CEU
        legadoId: 6,
        coordenadasAntigas: { latitude: -23.6222412, longitude: -46.7298498 },
    },
    {
        nome: 'CEU EMEF Paraisópolis',
        nomesAnteriores: ['EMEF CEU Paraisópolis'],
        endereco: 'R. Dr. José Augusto de Souza e Silva, S/N - Paraisópolis',
        latitude: -23.6231,
        longitude: -46.7281,
        aproximada: true, // dentro do lote do CEU
        legadoId: 7,
        coordenadasAntigas: { latitude: -23.6228409, longitude: -46.73 },
    },
    {
        nome: 'EMEF Dom Veremundo Toth',
        endereco: 'R. Dr. José Pedro de Carvalho Lima, 100 - Paraisópolis',
        latitude: -23.6223046,
        longitude: -46.7287146,
        legadoId: 8,
        coordenadasAntigas: { latitude: -23.6223, longitude: -46.7312 },
    },
    {
        nome: 'CEI Monsenhor Jonas Abib',
        nomesAnteriores: ['CEI Indireto (Monsenhor Jonas Abib)'],
        endereco: 'R. Santo Américo, 125 - Vila Morse - Jd. Colombo',
        latitude: -23.6054874,
        longitude: -46.7259589,
        legadoId: 9,
        coordenadasAntigas: { latitude: -23.6054007, longitude: -46.7286106 },
    },

    // --- novas, vindas da planilha ---
    {
        nome: 'Escola Paulo Freire',
        endereco: 'R. Melchior Giola, 296 - Paraisópolis',
        latitude: -23.6167385,
        longitude: -46.7236829,
    },
    {
        nome: 'EMEI Roberto Burle Marx',
        endereco: 'R. Irapará, 150 - Paraisópolis',
        latitude: -23.6224639,
        longitude: -46.7245227,
    },
    {
        nome: 'Instituto Prof.',
        endereco: 'R. Ernest Renan, 261 - Porto Seguro',
        latitude: -23.6076305,
        longitude: -46.723702,
    },
    {
        nome: 'Instituto Unidos de Paraisópolis',
        endereco: 'R. Manoel Antônio Pinto, 302 - Paraisópolis',
        latitude: -23.6137002,
        longitude: -46.7258369,
        aproximada: true, // OSM só tem a rua, não o número
    },
    {
        nome: 'CEI Fazenda Pedro e Maria',
        endereco: 'R. Silveira Sampaio, 190 - Fazenda Morumbi',
        latitude: -23.6157312,
        longitude: -46.7186207,
        aproximada: true, // OSM só tem a rua, não o número
    },
    {
        nome: 'Crescer Sempre',
        endereco: 'Rua Pasquale Gallupi, 928',
        latitude: -23.6119005,
        longitude: -46.725679,
    },
    {
        nome: 'CEU CEI Paraisópolis',
        endereco: 'R. Dr. José Augusto de Souza e Silva, S/N - Paraisópolis',
        latitude: -23.6223,
        longitude: -46.7281,
        aproximada: true, // dentro do lote do CEU
    },
    {
        nome: 'CEU Paraisópolis',
        endereco: 'R. Dr. José Augusto de Souza e Silva, S/N - Paraisópolis',
        latitude: -23.6228548,
        longitude: -46.727763,
    },
    {
        nome: 'CEI Indir',
        endereco: 'R. Ernest Renan, 1054 - Paraisópolis',
        latitude: -23.6143508,
        longitude: -46.7245519,
    },
    {
        nome: 'EE Governador Miguel Arraes',
        endereco: 'Rua Herbert Spencer, S/N - Paraisópolis',
        latitude: -23.6162259,
        longitude: -46.723729,
    },
    {
        nome: 'Escola Estadual Maria Zilda',
        endereco: 'R. Dr. José Carlos de Toledo Piza, S/N - Paraisópolis',
        latitude: -23.6211916,
        longitude: -46.7322471,
    },
    {
        nome: 'Escola Professora Etelvina de Goes Marcucci',
        endereco: 'R. Dr. José Carlos de Toledo Piza, 10 - Paraisópolis',
        latitude: -23.6209471,
        longitude: -46.7323245,
    },
    {
        nome: 'Escola Prof. Homero dos Santos',
        endereco: 'R. Herbert Spencer, 113 - Paraisópolis',
        latitude: -23.6163269,
        longitude: -46.723283,
    },
    {
        nome: 'CEI Santa Escolástica',
        endereco: 'R. Itapanhaú, 170 - Paraisópolis',
        latitude: -23.6150817,
        longitude: -46.7203223,
    },
];

/** A escola padrão que corresponde a um nome do banco (atual ou anterior). */
export function escolaPadraoPorNome(nome: string) {
    return ESCOLAS_PADRAO.find((p) => p.nome === nome || p.nomesAnteriores?.includes(nome));
}
