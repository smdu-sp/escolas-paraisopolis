'use client'

import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import Image from "next/image";

export default function Background() {
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
            width={800}
            height={800}
            src={tema === "dark" ? "/martinelli_noite.jpeg" : "/martinelli_dia.jpg"}
            alt="Edíficio Martinelli"
            className="absolute inset-0 h-full w-full object-cover md:hidden"
        />
}