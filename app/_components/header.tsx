"use client"

import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function Header() {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    return <div className="absolute t-0 p-4 md:px-8 bg-background text-foreground z-48 w-full flex flex-col md:flex-row justify-between items-center gap-2">
        <Image
            src={`${basePath}${mounted ? (currentTheme === "dark" ? "/prefeitura/logo-dark.png" : "/prefeitura/logo-light.png") : "/prefeitura/logo-light.png"}`}
            alt="Prefeitura de São Paulo"
            className="w-32 md:w-48"
            width={900}
            height={290}
        />
        <p className="text-lg md:text-2xl text-foreground font-bold">Caminhos Escolares Paraisópolis</p>
    </div>
}