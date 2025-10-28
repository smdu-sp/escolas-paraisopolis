'use client'

import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import Image from "next/image";

export default function Imagem() {
    const { theme, systemTheme } = useTheme();
    const tema = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);
    
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
            src={tema === "dark" ? "/martinelli_noite.jpeg" : "/martinelli_dia.jpg"}
            alt="Edíficio Martinelli"
            className="absolute inset-0 h-full w-full object-cover"
        />
    </div>
}