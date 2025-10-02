import { IUsuario } from "./usuario"

export enum Tipo_Documento {
  COMUNIQUESE = "Comunique-se",
  INDEFERIMENTO = "Indeferimento",
  DEFERIMENTO = "Deferimento"
}

export enum Colegiado {
  AR = "Aprova Rápido",
  RR = "Requalifica Rápido",
  CEUSO = "CEUSO",
  CAIEPS = "CAIEPS",
  CAEHIS = "CAEHIS",
  CPPU = "CPPU",
  CTLU = "CTLU",
}

export const Tipos_Documento = {
  COMUNIQUESE: "Comunique-se",
  INDEFERIMENTO: "Indeferimento",
  DEFERIMENTO: "Deferimento",
}

export const Colegiados = {
  AR: "Aprova Rápido",
  RR: "Requalifica Rápido",
  CEUSO: "CEUSO",
  CAIEPS: "CAIEPS",
  CAEHIS: "CAEHIS",
  CPPU: "CPPU",
  CTLU: "CTLU",
}

export interface IPublicacao {
    id: string
    numero_processo: string
    colegiado: Colegiado
    tipo_documento: Tipo_Documento
    tecnico_id: string
    coordenadoria_id: string
    data_emissao: Date
    data_publicacao: Date
    prazo: number
    criadoEm: Date
    atualizadoEm: Date
    tecnico?: IUsuario
    coordenadoria?: any
}

export interface ICreatePublicacao {
    numero_processo: string
    tipo_documento: string
    colegiado: string
    tecnico_rf: string
    coordenadoria_id: string
    data_emissao: Date
    data_publicacao: Date
    prazo: number
}

export interface IUpdatePublicacao {
    numero_processo: string
    tipo_documento: string
    colegiado: string
    tecnico_rf: string
    coordenadoria_id: string
    data_emissao: Date
    data_publicacao: Date
    prazo: number
}

export interface IPaginadoPublicacao {
	data: IPublicacao[];
	total: number;
	pagina: number;
	limite: number;
}

export interface IRespostaPublicacao {
	ok: boolean;
	error: string | null;
	data:
		| IPublicacao
		| IPublicacao[]
		| IPaginadoPublicacao
		| null;
	status: number;
}