import { useDebounce } from "@/hooks/useDebounce";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "../ui/command";

export default function IdentifierAutocomplete({
    identifiers = [],
    value,
    onSelect
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState(value ?? "");

    const deferredSearch = useDebounce(search, 200);

    const normalizedIdentifiers = useMemo(() => {
        return identifiers.map((item) => ({
            ...item,
            searchText: String(item.name ?? "").toLowerCase()
        }));
    }, [identifiers]);

    const matches = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase();

        if (!q) return [];

        return normalizedIdentifiers
            .filter((item) => item.searchText.includes(q))
            .slice(0, 5);
    }, [normalizedIdentifiers, deferredSearch]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Input
                    type="search"
                    placeholder="Buscar identificador"
                    className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => {
                        if (search.trim()) setOpen(true);
                    }}
                />
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="p-0 w-[420px] z-50"
            >
                <Command shouldFilter={false}>
                    {matches.length === 0 ? (
                        <CommandEmpty>Sin resultados</CommandEmpty>
                    ) : (
                        <CommandGroup heading="Identificadores">
                            {matches.map((item) => (
                                <CommandItem
                                    key={item.id ?? item.name}
                                    value={item.name}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onSelect={() => {
                                        setSearch(item.name);
                                        setOpen(false);
                                        onSelect(item);
                                    }}
                                >
                                    {item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </Command>
            </PopoverContent>
        </Popover>
    );
};