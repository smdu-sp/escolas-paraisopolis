import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para controlar se o componente foi hidratado
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Estado para armazenar o valor
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // useEffect para carregar dados do localStorage após a hidratação
  useEffect(() => {
    setIsHydrated(true);
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  // Retornar uma versão envolvida da função setter do useState que persiste o novo valor no localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que o valor seja uma função para que tenhamos a mesma API do useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Salvar estado
      setStoredValue(valueToStore);
      // Salvar no localStorage apenas após a hidratação
      if (isHydrated && typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // Uma implementação mais avançada lidaria com o caso de erro
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}