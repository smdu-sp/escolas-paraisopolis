'use client'

import sisar from "@/public/logo.png"
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import Image from "next/image";

export default function Logo() {
    const { theme, systemTheme } = useTheme();
    const tema = theme === "system" ? systemTheme : theme;
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) {
        return <Image
            width={1200}
            height={1200}
            src={"/public/logo.png"}
            alt="SISAR LOGO"
        />
    }

    return <Image
        width={1200}
        height={1200}
        src={sisar.src}
        alt="SISAR LOGO"
    />
}