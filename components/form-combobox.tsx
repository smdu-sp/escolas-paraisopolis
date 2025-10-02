"use client"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

export type OptionType = {
  label: string
  value: string
}

interface FormComboboxProps {
  name: string
  label?: string
  placeholder?: string
  description?: string
  options: OptionType[]
  emptyMessage?: string
  searchPlaceholder?: string
  className?: string
}

export function FormCombobox({
  name,
  label,
  placeholder = "Selecione uma opção...",
  description,
  options,
  emptyMessage = "Nenhuma opção encontrada.",
  searchPlaceholder = "Buscar opção...",
  className,
}: FormComboboxProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("max-w-[462px] justify-between", !field.value && "text-muted-foreground flex")}
                  title={field.value ? options.find((option) => option.value === field.value)?.label : placeholder}
                >
                  <p className="overflow-hidden text-ellipsis">
                    {field.value ? options.find((option) => option.value === field.value)?.label : placeholder}
                  </p>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full max-w-[462px]" align="start">
              <Command>
                <CommandInput placeholder={searchPlaceholder} />
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          field.onChange(option.value === field.value ? "" : option.value)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", option.value === field.value ? "opacity-100" : "opacity-0")}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
