"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MapMarker } from "@/components/map";
import dynamic from "next/dynamic";
import { Undo2, Plus, Trash2, Radio } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Questionario {
    escola: number;
    alunos: Date[];
    transporteIda: string[];
    transporteVolta: string[];
    acompanhantes: string[];
    partida?: Coordenadas;
    referencias: Coordenadas[];
    sentimentos: Sentimento[];
    problemas: Problema[];
    sugestoes: Sugestao[];
    reuniao?: Coordenadas;
    temReuniao: Boolean;
}

interface Coordenadas {
    lat: number;
    lng: number;
    nomeLocal: string;
}

interface Sentimento {
    parametro: string;
    valor: number;
}

interface Problema {
    ordem: number;
    problema: string;
}

interface Sugestao {
    ordem: number;
    sugestao: string;
}

export default function FormCaminhos() {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);
    
    const [step, setStep] = useLocalStorage('form-caminhos-step', 0);
    const [concluido, setConcluido] = useLocalStorage('form-caminhos-concluido', false);
    const [center, setCenter] = useLocalStorage<Coordenadas>('form-caminhos-center', {
        lat: -23.6157664,
        lng: -46.7268192,
        nomeLocal: ''
    });
    const respostaVazia = {
        escola: 1,
        alunos: [new Date()],
        transporteIda: [],
        transporteVolta: [],
        acompanhantes: [],
        referencias: [],
        sentimentos: [
            {
                parametro: 'Ruas e calçadas',
                valor: 5,
            },
            {
                parametro: 'Lixo',
                valor: 5,
            },
            {
                parametro: 'Esgoto',
                valor: 5,
            },
            {
                parametro: 'Segurança',
                valor: 5,
            },
            {
                parametro: 'Veículos em alta velocidade',
                valor: 5,
            }
        ],
        problemas: [],
        sugestoes: [],
        temReuniao: false,
    }
    const [resposta, setResposta] = useLocalStorage<Questionario>('form-caminhos-data', respostaVazia);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        if (center && Math.abs(center.lat) > 40 && Math.abs(center.lng) < 40) {
            setCenter({ lat: center.lng, lng: center.lat, nomeLocal: center.nomeLocal || '' });
        }
    }, [center]);
    const geojsonUrls = (process.env.NEXT_PUBLIC_GEOJSON_URLS || '').split(',').map(u => u.trim()).filter(Boolean);
    const kmzUrls = (process.env.NEXT_PUBLIC_KMZ_URLS || '').split(',').map(u => u.trim()).filter(Boolean);
    const [kmzAutoUrls, setKmzAutoUrls] = useState<string[]>([]);
    useEffect(() => {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        if ([7,9,14].includes(step) && kmzAutoUrls.length === 0) {
            fetch(`${basePath}/api/kmz/list`).then(r => r.json()).then((list) => setKmzAutoUrls(list || [])).catch(() => {});
        }
    }, [step]);
    
    const steps = 15;
    const [confirmOpen, setConfirmOpen] = useState(false);

    async function handleSaveForm() {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const escolaSel = escolas.find((e) => +e.id === resposta.escola);
        const payload = {
            escola: resposta.escola,
            escolaInfo: escolaSel ? {
                nome: escolaSel.title || String(resposta.escola),
                endereco: escolaSel.description || undefined,
                lat: escolaSel.coordinates[1],
                lng: escolaSel.coordinates[0],
            } : undefined,
            alunos: (resposta.alunos || []).map((d) => {
                const dt = d instanceof Date ? d : new Date(d);
                const ano = dt.getFullYear();
                const mes = String(dt.getMonth() + 1).padStart(2, '0');
                const dia = String(dt.getDate()).padStart(2, '0');
                return `${ano}-${mes}-${dia}`;
            }),
            transporteIda: resposta.transporteIda || [],
            transporteVolta: resposta.transporteVolta || [],
            acompanhantes: resposta.acompanhantes || [],
            partida: resposta.partida,
            referencias: resposta.referencias || [],
            sentimentos: resposta.sentimentos || [],
            problemas: resposta.problemas || [],
            sugestoes: resposta.sugestoes || [],
            reuniao: resposta.reuniao,
            temReuniao: !!resposta.temReuniao,
        };
        try {
            const resp = await fetch(`${basePath}/api/resposta`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await resp.json().catch(() => ({}));
            if (resp.ok && json?.ok) {
                toast.success('Formulário enviado com sucesso');
                setStep(steps);
                setResposta(respostaVazia);
                setConcluido(true);
            } else {
                toast.error('Falha ao enviar formulário');
            }
        } catch {
            toast.error('Erro ao enviar formulário');
        }
    }

    function checkNewStep(newStep: number) {
        const escola = escolas.find(escola => +escola.id === resposta.escola);
        switch(newStep) {
            case 7:
                if (resposta.partida) {
                    setCenter({ lat: resposta.partida.lat, lng: resposta.partida.lng, nomeLocal: resposta.partida.nomeLocal || 'Casa' });
                } else if (escola) {
                    setCenter({ lat: escola.coordinates[1], lng: escola.coordinates[0], nomeLocal: escola.title || '' });
                }
                break;
            case 9:
                if (resposta.partida)
                    setCenter({
                        lat: resposta.partida.lat,
                        lng: resposta.partida.lng,
                        nomeLocal: resposta.partida.nomeLocal || 'Casa'
                    })
                break;
        }
        if (newStep <= steps && newStep >= 0) setStep(newStep);
    }
    function handleStepBack() {
        checkNewStep(step - 1);
    }
    function podeAvancarAtual() {
        if (step === 3) return (resposta.transporteIda || []).length > 0;
        if (step === 4) return (resposta.transporteVolta || []).length > 0;
        if (step === 5) return (resposta.acompanhantes || []).length > 0;
        if (step === 7) return !!resposta.partida;
        return true;
    }
    function handleStepForward() {
        if (!podeAvancarAtual()) {
            if (step === 7) toast.error('Selecione sua casa no mapa');
            else toast.error('Selecione pelo menos uma opção');
            return;
        }
        checkNewStep(step + 1);
    }

    const progressValue = (step / (steps)) * 100;
    const mapSteps = [7, 9, 14];
    const MapComponent = dynamic(() => import("@/components/map"), { ssr: false });
    return (<>
        {mapSteps.includes(step) && (
        <MapComponent
            center={center && typeof center.lng === 'number' && typeof center.lat === 'number' ? [center.lng, center.lat] : undefined}
            markers={[
                ...escolas.map((e) => ({
                    ...e,
                    type: (+e.id === resposta.escola) ? 'school_selected' : 'school'
                } as MapMarker)),
                ...(resposta.partida ? [{
                    id: 'partida',
                    coordinates: [resposta.partida.lng, resposta.partida.lat],
                    type: 'house',
                    title: resposta.partida.nomeLocal || 'Casa'
                } as MapMarker] : []),
                ...(resposta.reuniao ? [{
                    id: 'reuniao',
                    coordinates: [resposta.reuniao.lng, resposta.reuniao.lat],
                    type: 'selected',
                    title: resposta.reuniao.nomeLocal || 'Reunião'
                } as MapMarker] : []),
                ...((resposta.referencias || []).map((ref, idx) => ({
                    id: `ref-${idx}`,
                    coordinates: [ref.lng, ref.lat],
                    type: 'selected',
                    title: ref.nomeLocal || 'Referência'
                } as MapMarker)))
            ]}
            onEmptyClick={(coordinates) => {
                if (step === 7) {
                    setResposta({
                        ...resposta,
                        partida: { lat: coordinates[1], lng: coordinates[0], nomeLocal: 'Casa' }
                    });
                    setCenter({ lat: coordinates[1], lng: coordinates[0], nomeLocal: 'Casa' });
                } else if (step === 9) {
                    // seleção aleatória será confirmada pelo Drawer com nome
                } else if (step === 14) {
                    // seleção aleatória será confirmada pelo Drawer com nome
                }
            }}
            enableReferenceSelection={[9,14].includes(step)}
            onSelectReference={(coords, nome) => {
                if (step === 9) {
                    const novaRef = { lat: coords[1], lng: coords[0], nomeLocal: nome || 'Referência' };
                    setResposta({
                        ...resposta,
                        referencias: [...(resposta.referencias || []), novaRef]
                    });
                } else if (step === 14) {
                    const reuniao = { lat: coords[1], lng: coords[0], nomeLocal: nome || 'Reunião' };
                    setResposta({
                        ...resposta,
                        reuniao
                    });
                }
            }}
            singleSelection={step === 14}
            geojsonUrls={geojsonUrls}
            kmzUrls={(kmzUrls.length ? kmzUrls : kmzAutoUrls).filter(u => step === 7 ? (decodeURIComponent(u.split('/').pop() || '') === 'SIRGAS_SHP_distrito.kmz') : true)}
            wmsLayers={process.env.NEXT_PUBLIC_QGIS_WMS_URL ? [{
                url: process.env.NEXT_PUBLIC_QGIS_WMS_URL as string,
                params: { LAYERS: process.env.NEXT_PUBLIC_QGIS_WMS_LAYERS || 'all', TILED: 'true' },
                serverType: 'qgis'
            }] : []}
        />)}
        {step === 7 && <SelecionarCasa canForward={!!resposta.partida} handleStepBack={handleStepBack} handleStepForward={handleStepForward} mounted={mounted} progressValue={progressValue} currentTheme={currentTheme} />}
        {step === 9 && <SelecionarPontosReferencia handleStepBack={handleStepBack} handleStepForward={handleStepForward} mounted={mounted} progressValue={progressValue} currentTheme={currentTheme} />}
        {step === 14 && <SelecionarPontosReferencia finalizar onFinalizar={() => setConfirmOpen(true)} handleStepBack={handleStepBack} handleStepForward={handleStepForward} mounted={mounted} progressValue={progressValue} currentTheme={currentTheme} />}
        {!mapSteps.includes(step) && <div className="relative h-full w-full bg-black/50 z-49">
            <Card className={`absolute bottom-0 md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-4xl shadow-md rounded-none md:rounded-2xl md:h-fit ${step > 0 ? 'h-full' : 'h-fit'} flex justify-between`}>
                {step > 0 && <CardHeader className="flex gap-0">
                    <CardTitle className="flex flex-col md:flex-row md:justify-between items-start gap-2">
                        <Image
                            src={mounted ? (currentTheme === "dark" ? "/prefeitura/logo-dark.png" : "/prefeitura/logo-light.png") : "/prefeitura/logo-light.png"}
                            alt="Prefeitura de São Paulo"
                            className="w-32 md:hidden"
                            width={900}
                            height={290}
                        />
                        {step !== 15 ? (
                            <Button variant="link" className="!px-0 max-sm:!text-lg md:hidden dark:text-foreground" onClick={() => handleStepBack()}>
                                <Undo2 /> Voltar
                            </Button>
                        ) : (
                            <div className="md:hidden h-9" />
                        )}
                    </CardTitle>
                    <CardDescription>
                        <Progress value={progressValue} className="w-full h-2 bg-gray-200 rounded-full" />
                    </CardDescription>
                </CardHeader>}
                <CardContent className={`space-y-4 max-sm:text-sm flex-1 ${step > 0 && 'overflow-auto'}`}>
                    {step === 0 && <Inicial />}
                    {step === 1 && <Escola resposta={resposta} setResposta={setResposta} />}
                    {step === 2 && <Alunos resposta={resposta} setResposta={setResposta} />}
                    {step === 3 && <TransporteIda resposta={resposta} setResposta={setResposta} />}
                    {step === 4 && <TransporteVolta resposta={resposta} setResposta={setResposta} />}
                    {step === 5 && <Acompanhantes resposta={resposta} setResposta={setResposta} />}
                    {step === 6 && <PontoPartida />}
                    {step === 8 && <PontosReferencia />}
                    {step === 10 && <Sentimentos resposta={resposta} setResposta={setResposta} />}
                    {step === 11 && <Problemas resposta={resposta} setResposta={setResposta} />}
                    {step === 12 && <Sugestoes resposta={resposta} setResposta={setResposta} />}
                    {step === 13 && <ReuniaoPrevia resposta={resposta} setResposta={setResposta} />}
                    {step === 15 && <Agradecimento />}
                </CardContent>
                <CardFooter className={`${step > 0 ? 'md:justify-between' : 'flex justify-end'} max-sm:flex-col max-sm:gap-2`}>
                    {(step > 0 && step !== 15) && <Button variant="outline" className="hidden md:flex dark:text-foreground" onClick={() => handleStepBack()}>
                        <Undo2 /> Voltar
                    </Button>}
                    {![13, 15].includes(step) && (
                        step === 14 ? (
                            <Button className="w-full md:w-fit" onClick={() => setConfirmOpen(true)}>Finalizar questionário</Button>
                        ) : (
                            <Button
                                className="w-full md:w-fit"
                                variant={((step === 3 && (resposta.transporteIda || []).length === 0) || (step === 4 && (resposta.transporteVolta || []).length === 0) || (step === 5 && (resposta.acompanhantes || []).length === 0)) ? 'outline' : undefined}
                                disabled={(step === 3 && (resposta.transporteIda || []).length === 0) || (step === 4 && (resposta.transporteVolta || []).length === 0) || (step === 5 && (resposta.acompanhantes || []).length === 0)}
                                onClick={() => handleStepForward()}
                            >
                                {((step === 3 && (resposta.transporteIda || []).length === 0) || (step === 4 && (resposta.transporteVolta || []).length === 0) || (step === 5 && (resposta.acompanhantes || []).length === 0))
                                    ? 'Selecione uma opção'
                                    : (step === 0 ? 'Iniciar questionário' : [6, 8].includes(step) ? 'Selecionar' : 'Próxima pergunta')}
                            </Button>
                        )
                    )}
                    {step === 13 &&
                        <div className="flex flex-col gap-2 md:flex-row-reverse w-full">
                            <Button className="w-full md:w-fit" onClick={() => handleStepForward()}>Sim, selecionar</Button>
                            <Button variant="outline" className="w-full md:w-fit" onClick={() => setConfirmOpen(true)}>Não, finalizar questionário</Button>
                        </div>
                    }
                </CardFooter>
            </Card>
        </div>}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirmar envio</DialogTitle>
                    <DialogDescription>
                        Você deseja realmente enviar as respostas do questionário?
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                    <Button onClick={() => { setConfirmOpen(false); handleSaveForm(); }}>Enviar</Button>
                </div>
            </DialogContent>
        </Dialog>
    </>)
}

const Inicial = () => {
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-bold">
                    Caminhos escolares Paraisópolis
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                    A Prefeitura de São Paulo quer ouvir você!
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                <p>Conte pra gente <span className="font-bold">como as crianças e adolescentes sob sua responsabilidade vão para a escola no Complexo Paraisópolis!</span></p>
                <p>A partir dessas contribuições, vamos <span className="font-bold">buscar soluções para deixar esses trajetos mais seguros, acolhedores e acessíveis para todos.</span></p>
                <p>Preencha o formulário a seguir. É rápido e não exige nenhum dado pessoal.</p>
                <p>Participe e ajude a transformar os caminhos escolares de Paraisópolis!</p>
            </CardContent>
        </>
    )
}


const escolas: MapMarker[] = [
    {
        id: '1',
        coordinates: [-46.7321158, -23.6219854],
        type: 'school',
        title: 'CEI Anglicana Morumbi',
        description: 'R. Dr. José Pedro de Carvalho Lima'
    },
    {
        id: '2',
        coordinates: [-46.7271946, -23.6221082],
        type: 'school',
        title: 'CEMEI Irapará',
        description: 'R. Irapará, 160'
    },
    {
        id: '3',
        coordinates: [-46.7319, -23.6215163],
        type: 'school',
        title: 'CEMEI Morumbi',
        description: 'R. Dr. José Pedro de Carvalho Lima, 150'
    },
    {
        id: '4',
        coordinates: [-46.7267886, -23.620817],
        type: 'school',
        title: 'EMEI Perimetral',
        description: 'R. Independência, 701'
    },
    {
        id: '5',
        coordinates: [-46.7244036, -23.6182211],
        type: 'school',
        title: 'EMEF Perimetral',
        description: 'Av. Hebe Camargo, 299'
    },
    {
        id: '6',
        coordinates: [-46.7298498, -23.6222412],
        type: 'school',
        title: 'EMEI CEU Paraisópolis',
        description: 'R. Dr. José Augusto de Souza e Silva, S/N'
    },
    {
        id: '7',
        coordinates: [-46.73, -23.6228409],
        type: 'school',
        title: 'EMEF CEU Paraisópolis',
        description: 'R. Dr. José Augusto de Souza e Silva, S/N'
    },
    {
        id: '8',
        coordinates: [-46.7312, -23.6223],
        type: 'school',
        title: 'EMEF Dom Veremundo Toth',
        description: 'R. Dr. José Pedro de Carvalho Lima, 100'
    },
    {
        id: '9',
        coordinates: [-46.7286106, -23.6054007],
        type: 'school',
        title: 'CEI Indireto (Monsenhor Jonas Abib)',
        description: 'R. Dr. José Pedro de Carvalho Lima'
    },
];

interface StepsProps {
    resposta: Questionario;
    setResposta: (resposta: Questionario) => void;
}

const Escola = ({ resposta, setResposta }: StepsProps) => {
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    1
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Selecione a escola:
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                <RadioGroup 
                    value={resposta.escola.toString()} 
                    onValueChange={(value) => setResposta({...resposta, escola: parseInt(value)})}
                >
                    {escolas.map((escola) => (
                        <div className="flex items-center gap-3" key={escola.id}>
                            <RadioGroupItem value={escola.id.toString()} id={escola.id.toString()} />
                            <Label className="text-sm font-normal" htmlFor={escola.id.toString()}>{escola.title}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </CardContent>
        </>
    )
}

const Alunos = ({ resposta, setResposta }: StepsProps) => {
    const garantirDatasValidas = (alunos: any[]) => {
        return alunos.map(aluno => {
            if (aluno instanceof Date) {
                return aluno;
            }
            if (typeof aluno === 'string') {
                return new Date(aluno);
            }
            return new Date();
        });
    };

    const alunosComDatasValidas = garantirDatasValidas(resposta.alunos);

    const adicionarAluno = () => {
        const novosAlunos = [...alunosComDatasValidas, new Date()];
        setResposta({...resposta, alunos: novosAlunos});
    };

    const removerAluno = (index: number) => {
        const novosAlunos = alunosComDatasValidas.filter((_, i) => i !== index);
        setResposta({...resposta, alunos: novosAlunos});
    };

    const atualizarDataAluno = (index: number, data: string) => {
        const novosAlunos = [...alunosComDatasValidas];
        const [ano, mes, dia] = data.split('-');
        const selecionada = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        const hoje = new Date();
        const dataValida = selecionada > hoje ? hoje : selecionada;
        novosAlunos[index] = dataValida;
        setResposta({...resposta, alunos: novosAlunos});
    };

    const formatarData = (data: Date) => {
        if (!data || isNaN(data.getTime())) {
            return '';
        }
        
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };

    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    2
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Insira as informações do(s) aluno(s):
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-auto">
                {alunosComDatasValidas.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        Nenhum aluno adicionado ainda. Clique no botão abaixo para adicionar.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {alunosComDatasValidas.map((aluno, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex flex-col gap-2 flex-1">
                                    <Label htmlFor={`aluno-${index}`} className="font-semibold min-w-fit">
                                        Aluno {index + 1}
                                    </Label>
                                    <Label htmlFor={`aluno-${index}`} className="text-muted-foreground min-w-fit">
                                        Data de Nascimento
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        {index > 0 && <Button
                                            variant="link"
                                            size="sm"
                                            onClick={() => removerAluno(index)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 !p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>}
                                        <Input
                                            id={`aluno-${index}`}
                                            type="date"
                                            value={formatarData(aluno)}
                                            onChange={(e) => atualizarDataAluno(index, e.target.value)}
                                            max={formatarData(new Date())}
                                            className="w-auto"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <Button
                    variant="link"
                    className="!px-0"
                    onClick={adicionarAluno}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Aluno
                </Button>
            </CardContent>
        </>
    )
}

const transportes = [
    "A pé",
    "Van escolar",
    "Moto",
    "Ônibus",
    "Bicicleta",
    "Carro"
]

const TransporteIda = ({ resposta, setResposta }: StepsProps) => {
    const outros = resposta.transporteIda.filter(t => !transportes.includes(t));
    const outro = outros.length > 0 ? outros[0] : '';
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    3
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Como eles vão pra escola?
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                {transportes.map((transporte, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Checkbox id={`transporte-ida-${index}`} checked={resposta.transporteIda.includes(transporte)} onCheckedChange={(checked) => {
                            if (checked) {
                                setResposta({...resposta, transporteIda: [...resposta.transporteIda, transporte]});
                            } else {
                                setResposta({...resposta, transporteIda: resposta.transporteIda.filter(t => t !== transporte)});
                            }
                        }} />
                        <Label htmlFor={`transporte-ida-${index}`} className="text-md min-w-fit">
                            {transporte}
                        </Label>
                    </div>
                ))}
                <div key={"outro"} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Checkbox id={`transporte-ida-outro`} checked={resposta.transporteIda.includes(outro)} onCheckedChange={(checked) => {
                            if (checked) {
                                setResposta({...resposta, transporteIda: [...resposta.transporteIda, outro]});
                            } else {
                                setResposta({...resposta, transporteIda: resposta.transporteIda.filter(t => t !== outro)});
                            }
                        }} />
                        <Label htmlFor={`transporte-ida-outro`} className="text-md min-w-fit">
                            Outro
                        </Label>
                    </div>
                    <Input
                        id={`transporte-ida-outro`}
                        type="text"
                        value={outro}
                        onChange={(e) => {
                            const novoOutro = e.target.value;
                            setResposta({
                                ...resposta,
                                transporteIda: resposta.transporteIda.filter(t => t !== outro).concat(novoOutro ? [novoOutro] : [])
                            });
                        }}
                        className="w-auto"
                    />
                </div>
            </CardContent>
        </>
    )
}

const TransporteVolta = ({ resposta, setResposta }: StepsProps) => {
    const outros = resposta.transporteVolta.filter(t => !transportes.includes(t));
    const outro = outros.length > 0 ? outros[0] : '';
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    4
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Como eles voltam da escola?
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                {transportes.map((transporte, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Checkbox id={`transporte-volta-${index}`} checked={resposta.transporteVolta.includes(transporte)} onCheckedChange={(checked) => {
                            if (checked) {
                                setResposta({...resposta, transporteVolta: [...resposta.transporteVolta, transporte]});
                            } else {
                                setResposta({...resposta, transporteVolta: resposta.transporteVolta.filter(t => t !== transporte)});
                            }
                        }} />
                        <Label htmlFor={`transporte-volta-${index}`} className="text-md min-w-fit">
                            {transporte}
                        </Label>
                    </div>
                ))}
                <div key={"outro"} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Checkbox id={`transporte-volta-outro`} checked={resposta.transporteVolta.includes(outro)} onCheckedChange={(checked) => {
                            if (checked) {
                                setResposta({...resposta, transporteVolta: [...resposta.transporteVolta, outro]});
                            } else {
                                setResposta({...resposta, transporteVolta: resposta.transporteVolta.filter(t => t !== outro)});
                            }
                        }} />
                        <Label htmlFor={`transporte-volta-outro`} className="text-md min-w-fit">
                            Outro
                        </Label>
                    </div>
                    <Input
                        id={`transporte-volta-outro`}
                        type="text"
                        value={outro}
                        onChange={(e) => {
                            const novoOutro = e.target.value;
                            setResposta({
                                ...resposta,
                                transporteVolta: resposta.transporteVolta.filter(t => t !== outro).concat(novoOutro ? [novoOutro] : [])
                            });
                        }}
                        className="w-auto"
                    />
                </div>
            </CardContent>
        </>
    )
}

const acompanhantes = [
    "Mãe",
    "Pai",
    "Avô/Avó",
]

const Acompanhantes = ({ resposta, setResposta }: StepsProps) => {
    const outros = resposta.acompanhantes ? resposta.acompanhantes.filter(t => !acompanhantes.includes(t)) : [];
    const outro = outros.length > 0 ? outros[0] : '';
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    5
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Quem o(s) acompanha?
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                {acompanhantes.map((acompanhante, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Checkbox id={`acompanhante-${index}`} checked={resposta.acompanhantes && resposta.acompanhantes.includes(acompanhante)} onCheckedChange={(checked) => {
                            if (checked) {
                                setResposta({...resposta, acompanhantes: [...resposta.acompanhantes, acompanhante]});
                            } else {    
                                setResposta({...resposta, acompanhantes: resposta.acompanhantes.filter(a => a !== acompanhante)});
                            }
                        }} />
                        <Label htmlFor={`acompanhante-${index}`} className="text-md min-w-fit">
                            {acompanhante}
                        </Label>
                    </div>
                ))}
                <div key={"outro"} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Checkbox id={`acompanhante-outro`} checked={resposta.acompanhantes && resposta.acompanhantes.includes(outro)} onCheckedChange={(checked) => {
                            if (checked) {
                                setResposta({...resposta, acompanhantes: [...resposta.acompanhantes, outro]});
                            } else {
                                setResposta({...resposta, acompanhantes: resposta.acompanhantes.filter(a => a !== outro)});
                            }
                        }} />
                        <Label htmlFor={`acompanhante-outro`} className="text-md min-w-fit">
                            Outro
                        </Label>
                    </div>
                    <Input
                        id={`acompanhante-outro`}
                        type="text"
                        value={outro}
                        onChange={(e) => {
                            const novoOutro = e.target.value;
                            setResposta({
                                ...resposta,
                                acompanhantes: resposta.acompanhantes.filter(a => a !== outro).concat(novoOutro ? [novoOutro] : [])
                            });
                        }}
                        className="w-auto"
                    />
                </div>
            </CardContent>
        </>
    )
}

const PontoPartida = () => {
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    6
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Agora seguiremos para a identificação do percurso no mapa.
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                <Image
                    src="/casa_imagem.png"
                    alt="Pin de Casa"
                    className="mx-auto"
                    width={91}
                    height={122}
                />
                <p className="font-semibold text-foreground">Primeiro, selecione o ponto de partida. Você pode inserir a localização atual, digitar o endereço, ou selecionar direto no mapa.</p>
            </CardContent>
        </>
    )
}

interface MapStepProps {
    handleStepBack: () => void;
    handleStepForward: () => void;
    mounted: boolean;
    currentTheme?: string;
    progressValue: number;
    finalizar?: boolean;
    onFinalizar?: () => void;
    canForward?: boolean;
}

const SelecionarCasa = ({ handleStepBack, handleStepForward, mounted, currentTheme, progressValue, canForward }: MapStepProps ) => {
    return (
        <>
            <div className="absolute z-50 md:p-1 md:mt-20 w-full">
                <Card className="rounded-none md:rounded-lg w-full">
                    <CardHeader className="flex gap-0">
                        <CardTitle className="flex flex-col md:flex-row md:justify-between items-start gap-2">
                            <Image
                                src={mounted ? (currentTheme === "dark" ? "/prefeitura/logo-dark.png" : "/prefeitura/logo-light.png") : "/prefeitura/logo-light.png"}
                                alt="Prefeitura de São Paulo"
                                className="w-32 md:hidden"
                                width={900}
                                height={290}
                            />
                            <Button variant="link" className="!px-0 max-sm:!text-lg dark:text-foreground" onClick={() => handleStepBack()}>
                                <Undo2 /> Voltar
                            </Button>
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-4">
                            <Progress value={progressValue} className="w-full h-2 bg-gray-200 rounded-full" />
                            <p className="text-foreground font-semibold">Clique Para Identificar no mapa onde fica sua casa</p>
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
            <div className="absolute z-50 md:p-1 bottom-10 w-full flex items-center justify-center">
                <Button className="!px-0 w-fit min-w-48" disabled={!canForward} onClick={() => handleStepForward()}>
                    Seguir
                </Button>
            </div>
        </>
    )
}

const PontosReferencia = () => {
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    7
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Agora, a partir dos pontos de referências identificados no mapa, selecione os pontos de referência que você passa a caminho da escola. Alguns lugares já estão em destaque no mapa. Se você quiser selecionar um ponto não mapeado, basta clicar no lugar onde ele fica e nomeá-lo.
                </CardDescription>
            </div>
        </>
    )
}

const SelecionarPontosReferencia = ({ handleStepBack, handleStepForward, mounted, currentTheme, progressValue, finalizar, onFinalizar }: MapStepProps) => {
    return (
        <>
            <div className="absolute z-50 md:p-1 md:mt-20 w-full">
                <Card className="rounded-none md:rounded-lg w-full">
                    <CardHeader className="flex gap-0">
                        <CardTitle className="flex flex-col md:flex-row md:justify-between items-start gap-2">
                            <Image
                                src={mounted ? (currentTheme === "dark" ? "/prefeitura/logo-dark.png" : "/prefeitura/logo-light.png") : "/prefeitura/logo-light.png"}
                                alt="Prefeitura de São Paulo"
                                className="w-32 md:hidden"
                                width={900}
                                height={290}
                            />
                            <Button variant="link" className="!px-0 max-sm:!text-lg dark:text-foreground" onClick={() => handleStepBack()}>
                                <Undo2 /> Voltar
                            </Button>
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-4">
                            <Progress value={progressValue} className="w-full h-2 bg-gray-200 rounded-full" />
                            <p className="text-foreground font-semibold">Clique para identificar os pontos de referência no caminho até a escola</p>
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
            <div className="absolute z-50 md:p-1 bottom-10 w-full flex items-center justify-center">
                <Button className="!px-0 w-fit min-w-48" onClick={() => (finalizar && onFinalizar) ? onFinalizar() : handleStepForward()}>
                    {finalizar ? 'Finalizar questionário' : 'Seguir'}
                </Button>
            </div>
        </>
    )
}

const parametrosSentimentos = [
    {
        parametro: 'Ruas e calçadas',
        valor: 5,
    },
    {
        parametro: 'Lixo',
        valor: 5,
    },
    {
        parametro: 'Esgoto',
        valor: 5,
    },
    {
        parametro: 'Segurança',
        valor: 5,
    },
    {
        parametro: 'Veículos em alta velocidade',
        valor: 5,
    },
]

const Sentimentos = ({ resposta, setResposta }: StepsProps) => {
    const handleSentimentoChange = (parametro: string, valor: string) => {
        const novoValor = parseInt(valor);
        const novosSentimentos = resposta.sentimentos.map(sentimento => 
            sentimento.parametro === parametro 
                ? { ...sentimento, valor: novoValor }
                : sentimento
        );
        setResposta({ ...resposta, sentimentos: novosSentimentos });
    };
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    8
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    De 1 a 5, sendo 1 muito ruim e 5 muito bom, como você se sente nesse deslocamento?
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                <div className="grid grid-cols-7">
                    <div className="text-foreground font-semibold col-span-2"></div>
                    <div className="text-foreground font-semibold flex items-center justify-center">1</div>
                    <div className="text-foreground font-semibold flex items-center justify-center">2</div>
                    <div className="text-foreground font-semibold flex items-center justify-center">3</div>
                    <div className="text-foreground font-semibold flex items-center justify-center">4</div>
                    <div className="text-foreground font-semibold flex items-center justify-center">5</div>
                </div>
                {parametrosSentimentos.map((sentimento, index) => (
                    <RadioGroup 
                        key={`${sentimento.parametro}-${index}`}
                        className="grid grid-cols-7" 
                        value={resposta.sentimentos[index].valor.toString()}
                        onValueChange={(valor) => handleSentimentoChange(sentimento.parametro, valor)}
                    >
                        <div className="text-foreground text-xs font-semibold col-span-2">{sentimento.parametro}</div>
                        {[1, 2, 3, 4, 5].map((valor) => (
                            <div className="text-foreground font-semibold flex items-center justify-center" key={valor}>
                                <RadioGroupItem value={valor.toString()} />
                            </div>
                        ))}
                    </RadioGroup>
                ))}
            </CardContent>
        </>
    )
}

const problemas = [
    "Esgoto",
    "Lixo",
    "Calçadas estreitas ou inexistentes",
    "Carros e motos em alta velocidade",
    "Falta de segurança",
    "Falta de áreas verdes"
]

const sugestoes = [
    "Mais espaço para caminhar",
    "Mais áreas verdes",
    "Praças",
    "Espaços para brincar",
    "Iluminação melhor",
]

const Problemas = ({ resposta, setResposta }: StepsProps) => {
    const [outroProblema, setOutroProblema] = useState("");
    useEffect(() => {
        const outroExistente = resposta.problemas.find(p => p.problema.startsWith("Outro: "));
        if (outroExistente) {
            const textoOutro = outroExistente.problema.replace("Outro: ", "");
            setOutroProblema(textoOutro);
        } else {
            setOutroProblema("");
        }
    }, [resposta.problemas]);

    const handleProblemaChange = (problema: string, checked: boolean) => {
        const problemasAtuais = [...resposta.problemas];
        
        if (checked) {
            if (problemasAtuais.length >= 3) {
                return;
            }
            const novaOrdem = problemasAtuais.length + 1;
            problemasAtuais.push({
                ordem: novaOrdem,
                problema: problema
            });
        } else {
            const index = problemasAtuais.findIndex(p => p.problema === problema);
            if (index !== -1) {
                problemasAtuais.splice(index, 1);
                problemasAtuais.forEach((p, i) => {
                    p.ordem = i + 1;
                });
            }
        }
        
        setResposta({
            ...resposta,
            problemas: problemasAtuais
        });
    };

    const handleOutroProblemaChange = (value: string) => {
        setOutroProblema(value);
        
        const problemasAtuais = [...resposta.problemas];
        const outroIndex = problemasAtuais.findIndex(p => p.problema.startsWith("Outro: "));
        
        if (value.trim()) {
            if (outroIndex === -1 && problemasAtuais.length < 3) {
                const novaOrdem = problemasAtuais.length + 1;
                problemasAtuais.push({
                    ordem: novaOrdem,
                    problema: `Outro: ${value.trim()}`
                });
            } else if (outroIndex !== -1) {
                problemasAtuais[outroIndex].problema = `Outro: ${value.trim()}`;
            }
        } else {
            if (outroIndex !== -1) {
                problemasAtuais.splice(outroIndex, 1);
                problemasAtuais.forEach((p, i) => {
                    p.ordem = i + 1;
                });
            }
        }
        
        setResposta({
            ...resposta,
            problemas: problemasAtuais
        });
    };

    const handleOutroCheckboxChange = (checked: boolean) => {
        if (checked && outroProblema.trim()) {
            handleProblemaChange(`Outro: ${outroProblema.trim()}`, true);
        } else if (!checked) {
            const problemasAtuais = resposta.problemas.filter(p => !p.problema.startsWith("Outro: "));
            problemasAtuais.forEach((p, i) => {
                p.ordem = i + 1;
            });
            setResposta({
                ...resposta,
                problemas: problemasAtuais
            });
        }
    };

    const isProblemaSelected = (problema: string) => {
        return resposta.problemas.some(p => p.problema === problema);
    };

    const getProblemaOrdem = (problema: string) => {
        const problemaObj = resposta.problemas.find(p => p.problema === problema);
        return problemaObj ? problemaObj.ordem : null;
    };

    const isOutroSelected = resposta.problemas.some(p => p.problema.startsWith("Outro: "));
    const isMaxSelectionReached = resposta.problemas.length >= 3;

    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    9
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Quais são os principais problemas enfrentados nesse percurso? Selecione até três, em ordem.
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                {problemas.map((problema, index) => {
                    const isSelected = isProblemaSelected(problema);
                    const ordem = getProblemaOrdem(problema);
                    const isDisabled = !isSelected && isMaxSelectionReached;
                    
                    return (
                        <div key={index} className={`flex items-center gap-2 ${isDisabled ? 'opacity-50' : ''}`}>
                            <Checkbox
                                id={`problema-${index}`}
                                checked={isSelected}
                                disabled={isDisabled}
                                onCheckedChange={(checked) => handleProblemaChange(problema, checked as boolean)}
                            />
                            {isSelected && (
                                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full">
                                    {ordem}
                                </div>
                            )}
                            <Label 
                                htmlFor={`problema-${index}`} 
                                className={`text-md min-w-fit flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {problema}
                            </Label>
                        </div>
                    );
                })}
                <div key={"outro"} className={`flex flex-col gap-2 ${!isOutroSelected && isMaxSelectionReached ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="problema-outro"
                            checked={isOutroSelected}
                            disabled={!isOutroSelected && isMaxSelectionReached}
                            onCheckedChange={handleOutroCheckboxChange}
                        />
                        {isOutroSelected && (
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full">
                                {resposta.problemas.find(p => p.problema.startsWith("Outro: "))?.ordem}
                            </div>
                        )}
                        <Label 
                            htmlFor="problema-outro" 
                            className={`text-md min-w-fit ${!isOutroSelected && isMaxSelectionReached ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            Outro
                        </Label>
                    </div>
                    <Input
                        type="text"
                        placeholder="Descreva o problema..."
                        value={outroProblema}
                        onChange={(e) => handleOutroProblemaChange(e.target.value)}
                        disabled={isMaxSelectionReached && !isOutroSelected}
                        className="w-auto"
                    />
                </div>
                
                {resposta.problemas.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-sm text-blue-800 mb-2">Problemas selecionados (em ordem):</h4>
                        <ol className="list-decimal list-inside space-y-1">
                            {resposta.problemas
                                .sort((a, b) => a.ordem - b.ordem)
                                .map((problema, index) => (
                                    <li key={index} className="text-sm text-blue-700">
                                        {problema.problema}
                                    </li>
                                ))}
                        </ol>
                    </div>
                )}
                
                <div className="text-sm text-gray-600 mt-2">
                    {resposta.problemas.length}/3 problemas selecionados
                </div>
            </CardContent>
        </>
    )
}

const Sugestoes = ({ resposta, setResposta }: StepsProps) => {
    const [outroSugestao, setOutroSugestao] = useState('')
    useEffect(() => {
        const outroExistente = resposta.sugestoes.find(s => s.sugestao.startsWith("Outro: "));
        if (outroExistente) {
            const textoOutro = outroExistente.sugestao.replace("Outro: ", "");
            setOutroSugestao(textoOutro);
        } else {
            setOutroSugestao("");
        }
    }, [resposta.sugestoes]);

    const handleSugestaoChange = (sugestao: string, checked: boolean) => {
        if (checked) {
            if (resposta.sugestoes.length < 3) {
                const novaSugestao: Sugestao = {
                    ordem: resposta.sugestoes.length + 1,
                    sugestao: sugestao
                }
                setResposta({
                    ...resposta,
                    sugestoes: [...resposta.sugestoes, novaSugestao]
                })
            }
        } else {
            const sugestoesAtualizadas = resposta.sugestoes
                .filter(s => s.sugestao !== sugestao)
                .map((s, index) => ({ ...s, ordem: index + 1 }))
            
            setResposta({
                ...resposta,
                sugestoes: sugestoesAtualizadas
            })
        }
    }

    const isSugestaoSelected = (sugestao: string) => {
        return resposta.sugestoes.some(s => s.sugestao === sugestao)
    }

    const getSugestaoOrder = (sugestao: string) => {
        const sugestaoEncontrada = resposta.sugestoes.find(s => s.sugestao === sugestao)
        return sugestaoEncontrada ? sugestaoEncontrada.ordem : null
    }

    const isMaxSugestaoSelectionReached = resposta.sugestoes.length >= 3;
    const isOutroSugestaoSelected = resposta.sugestoes.some(s => s.sugestao.startsWith("Outro: "));

    const handleOutroSugestaoChange = (value: string) => {
        setOutroSugestao(value)
        
        if (value.trim()) {
            const outroExistente = resposta.sugestoes.find(s => s.sugestao.startsWith('Outro: '))
            
            if (outroExistente) {
                const sugestoesAtualizadas = resposta.sugestoes.map(s => 
                    s.sugestao.startsWith('Outro: ') 
                        ? { ...s, sugestao: `Outro: ${value}` }
                        : s
                )
                setResposta({
                    ...resposta,
                    sugestoes: sugestoesAtualizadas
                })
            } else {
                // Adicionar novo "Outro" se não estiver no limite
                if (resposta.sugestoes.length < 3) {
                    const novaSugestao: Sugestao = {
                        ordem: resposta.sugestoes.length + 1,
                        sugestao: `Outro: ${value}`
                    }
                    setResposta({
                        ...resposta,
                        sugestoes: [...resposta.sugestoes, novaSugestao]
                    })
                }
            }
        } else {
            const sugestoesAtualizadas = resposta.sugestoes
                .filter(s => !s.sugestao.startsWith('Outro: '))
                .map((s, index) => ({ ...s, ordem: index + 1 }))
            
            setResposta({
                ...resposta,
                sugestoes: sugestoesAtualizadas
            })
        }
    }

    const handleOutroCheckboxChange = (checked: boolean) => {
        if (!checked) {
            setOutroSugestao('')
            const sugestoesAtualizadas = resposta.sugestoes
                .filter(s => !s.sugestao.startsWith('Outro: '))
                .map((s, index) => ({ ...s, ordem: index + 1 }))
            
            setResposta({
                ...resposta,
                sugestoes: sugestoesAtualizadas
            })
        }
    }

    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    10
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    Quais são as principais sugestões para melhorar esse percurso? Selecione até três, em ordem.
                </CardDescription>
            </div>
            <CardContent className="space-y-4 max-sm:text-sm p-0 overflow-hidden">
                <div className="space-y-3">
                    {sugestoes.map((sugestao, index) => {
                        const isSelected = isSugestaoSelected(sugestao);
                        const ordem = getSugestaoOrder(sugestao);
                        const isDisabled = !isSelected && isMaxSugestaoSelectionReached;
                        
                        return (
                            <div key={index} className={`flex items-center gap-2 ${isDisabled ? 'opacity-50' : ''}`}>
                                <Checkbox
                                    id={`sugestao-${index}`}
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => handleSugestaoChange(sugestao, checked as boolean)}
                                />
                                {isSelected && (
                                    <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full">
                                        {ordem}
                                    </div>
                                )}
                                <Label 
                                    htmlFor={`sugestao-${index}`} 
                                    className={`text-md min-w-fit flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {sugestao}
                                </Label>
                            </div>
                        );
                    })}
                    <div key={"outro"} className={`flex flex-col gap-2 ${!isOutroSugestaoSelected && isMaxSugestaoSelectionReached ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="sugestao-outro"
                                checked={isOutroSugestaoSelected}
                                disabled={!isOutroSugestaoSelected && isMaxSugestaoSelectionReached}
                                onCheckedChange={handleOutroCheckboxChange}
                            />
                            {isOutroSugestaoSelected && (
                                <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-sm font-bold rounded-full">
                                    {resposta.sugestoes.find(s => s.sugestao.startsWith("Outro: "))?.ordem}
                                </div>
                            )}
                            <Label 
                                htmlFor="sugestao-outro" 
                                className={`text-md min-w-fit ${!isOutroSugestaoSelected && isMaxSugestaoSelectionReached ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                Outro
                            </Label>
                        </div>
                        <Input
                            type="text"
                            placeholder="Descreva a sugestão..."
                            value={outroSugestao}
                            onChange={(e) => handleOutroSugestaoChange(e.target.value)}
                            disabled={isMaxSugestaoSelectionReached && !isOutroSugestaoSelected}
                            className="w-auto"
                        />
                    </div>
                </div>
                {resposta.sugestoes.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-sm text-blue-800 mb-2">Sugestões selecionadas (em ordem):</h4>
                        <ol className="list-decimal list-inside space-y-1">
                            {resposta.sugestoes
                                .sort((a, b) => a.ordem - b.ordem)
                                .map((sugestao, index) => (
                                    <li key={index} className="text-sm text-blue-700">
                                        {sugestao.sugestao}
                                    </li>
                                ))}
                        </ol>
                    </div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                    {resposta.sugestoes.length}/3 sugestões selecionadas
                </div>
            </CardContent>
        </>
    )
}

const ReuniaoPrevia = ({resposta, setResposta}: {resposta: Questionario, setResposta: (resposta: Questionario) => void}) => {
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-2xl font-semibold">
                    11
                </CardTitle>
                <CardDescription className="font-semibold text-foreground">
                    <p className="mb-2">Existe algum lugar onde as crianças e adolescentes se reúnam para brincar ou descansar?</p>
                    <p>Selecione no mapa.</p>
                </CardDescription>
            </div>
        </>
    )
}

const Agradecimento = () => {
    return (
        <>
            <div className="flex flex-col space-y-1">
                <CardTitle className="text-lg font-semibold">
                    Obrigado por participar!
                </CardTitle>
                <CardDescription className="text-foreground">
                    Juntos, vamos transformar Paraisópolis em um lugar melhor para estudar e viver!
                </CardDescription>
            </div>
        </>
    )
}
