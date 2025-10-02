export interface ICoordenadoriaSelect {
    value: string;
    label: string;
}

export interface IRespostaCoordenadoria {
    ok: boolean;
    error: string | null;
    data:
        | ICoordenadoriaSelect[]
        | null;
    status: number;
}