'use client'

import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import Image from "next/image";

export default function Imagem() {
    const { theme, systemTheme } = useTheme();
    const tema = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) {
        return <div className="relative hidden bg-muted md:block">
        </div>
    }

    return <div className="relative hidden bg-muted md:block">
        <Image
            width={1200}
            height={1200}
            src={`${basePath}/${tema === "dark" ? "/martinelli_noite.jpeg" : "/martinelli_dia.jpg"}`}
            alt="Edíficio Martinelli"
            className="absolute inset-0 h-full w-full object-cover"
        />
    </div>
}