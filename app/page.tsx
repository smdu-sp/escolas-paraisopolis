"use client"

import FormCaminhos from './_components/form-caminhos';
import Header from './_components/header';
import { Button } from '@/components/ui/button';
import { LockKeyhole, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function Home() {
  const { theme, setTheme } = useTheme();
  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <Button
        onClick={handleThemeToggle}
        size="sm"
        className="w-12 h-12 md:w-8 md:h-8 p-0 shadow-lg touch-manipulation absolute z-50 right-2 mt-2 md:bottom-10 md:left-3"
        variant="outline"
        title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        suppressHydrationWarning
      >
        <Sun className="h-5 w-5 md:h-4 md:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 md:h-4 md:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
      {/* Acesso discreto à área administrativa (sem login, a rota leva para /login) */}
      <Link
        href="/respostas"
        title="Área administrativa"
        aria-label="Área administrativa"
        className="absolute z-50 left-2 mt-2 md:mt-0 md:left-3 md:bottom-20 flex items-center justify-center w-9 h-9 md:w-8 md:h-8 rounded-md text-muted-foreground opacity-40 hover:opacity-100 hover:bg-accent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
      >
        <LockKeyhole className="h-4 w-4" />
      </Link>
      <Header />
      <FormCaminhos />
    </div>
  );
}