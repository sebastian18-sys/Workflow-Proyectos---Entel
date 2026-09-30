import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Badge } from "./badge";
import { Check, ChevronDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { cn } from "@/lib/utils";

export default function MultiSelectFilter({
    label,
    icon: Icon,
    options = [],
    selected = [],
    onChange,
    placeholder,
    disabled,
}) {
    const [open, setOpen] = useState(false);

    const toggleOption = (value) => {
        if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
        return;
        }
        onChange([...selected, value]);
    };

    const clearAll = () => onChange([]);

    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {Icon ? <Icon className="h-4 w-4 text-[#2b7fff]" /> : null}
                {label}
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-auto min-h-11 w-full justify-between rounded-2xl border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
                        disabled={disabled}
                        aria-label={label}
                    >
                        <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1.5 pr-3">
                        {selected.length === 0 ? (
                            <span className="text-sm text-slate-400">{placeholder}</span>
                        ) : (
                            selected.slice(0, 2).map((item) => (
                            <Badge
                                key={item}
                                variant="secondary"
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                            >
                                {item}
                            </Badge>
                            ))
                        )}
                        {selected.length > 2 ? (
                            <Badge className="rounded-full bg-[#2b7fff] px-2 py-0.5 text-xs text-white">
                                +{selected.length - 2}
                            </Badge>
                        ) : null}
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] rounded-2xl border-slate-200 p-0 shadow-xl" align="start">
                    <Command>
                        <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
                        <CommandList>
                            <CommandEmpty>Sin resultados.</CommandEmpty>
                            <CommandGroup>
                                <div className="flex items-center justify-between px-2 py-2">
                                <span className="text-xs font-medium text-slate-500">
                                    {selected.length} seleccionados
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 rounded-lg px-2 text-xs"
                                    onClick={clearAll}
                                    disabled={selected.length === 0}
                                >
                                    Limpiar
                                </Button>
                                </div>
                                {options.map((option) => {
                                const active = selected.includes(option);
                                return (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => toggleOption(option)}
                                        className="flex cursor-pointer items-center justify-between rounded-xl"
                                    >
                                        <span className="truncate">{option}</span>
                                        <Check
                                            className={cn(
                                            "h-4 w-4",
                                            active ? "opacity-100 text-[#2b7fff]" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}