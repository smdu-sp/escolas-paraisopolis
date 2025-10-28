"use client"

import FormCaminhos from './_components/form-caminhos';
import Header from './_components/header';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
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
      <Header />
      <FormCaminhos />
    </div>
  );
}