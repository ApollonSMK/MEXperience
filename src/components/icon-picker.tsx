
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import * as icons from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getIcon } from "@/lib/icon-map";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

// We are only getting the keys of the icons object, and not the whole object
// This is to avoid serializing the entire lucide-react library
const iconNames = Object.keys(icons).filter(key => 
    // Filter out non-icon exports like 'createLucideIcon', 'icons' etc.
    // A simple heuristic is that icon components are functions and start with an uppercase letter.
    typeof (icons as any)[key] === 'function' && key[0] === key[0].toUpperCase()
);

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const Icon = getIcon(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {value ? value : "Selecione um ícone..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Procurar ícone..." />
          <CommandList>
            <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
            <CommandGroup>
              {iconNames.map((iconName) => {
                const CurrentIcon = (icons as any)[iconName];
                return (
                  <CommandItem
                    key={iconName}
                    value={iconName}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === iconName ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <CurrentIcon className="mr-2 h-4 w-4" />
                    {iconName}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
