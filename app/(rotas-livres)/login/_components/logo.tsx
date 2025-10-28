'use client'

import { useEffect, useState } from 'react';
import Image from "next/image";
import { useTheme } from 'next-themes';

export default function Logo() {
    const { theme, systemTheme } = useTheme();
    const tema = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) {
        return <div className="absolute inset-0 bg-muted h-full w-full object-cover" />
    }

    return <Image
        width={1200}
        height={1200}
        src={tema === "dark" ? "/logo_claro.png" : "/logo_escuro.png"}
        alt="LOGO PREFEITURA DE SÃO PAULO"
    />
}