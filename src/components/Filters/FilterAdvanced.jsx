// import { useState, useEffect } from "react"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Separator } from "@/components/ui/separator"
// import { Input } from "@/components/ui/input"
// import useFilter from "@/hooks/useFilter"
// import {
//   Search,
//   ListFilter,
//   X,
//   CalendarIcon,
// } from "lucide-react"

// export default function FilterAdvanced({ columns, availableFilters, data, onChange }) {

//     // const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

//     const { 
// 		activeFilters, 
// 		filteredAvailableFilters,
// 		selectedFilterType,
// 		setSelectedFilterType, 
// 		filterSearchQuery,
// 		setFilterSearchQuery,
// 		tempFilterValue,
// 		setTempFilterValue,
// 		filterPopoverOpen,
// 		setFilterPopoverOpen,
// 		applyFilters, 
// 		clearFilters, 
// 		addFilter, 
// 		confirmFilter, 
// 		removeFilter, 
// 		clearAllFilters 
// 	} = useFilter({ columns, availableFilters })

// 	// console.log("ACTIVE FILTERS", activeFilters)

// 	useEffect(() => {
// 		// if (activeFilters.length > 0) {
// 			onChange?.(activeFilters)
// 		// }
// 	}, [activeFilters])

// 	function setSelectData(value) {
// 		const set = new Set(data.map(d => d[value]))
// 		return Array.from(set)
// 		// return Array.from(set).sort((a, b) => a.localeCompare(b));
// 	}

//     return (
//         <>
//             <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
// 				<PopoverTrigger asChild>
// 					<div className="relative w-fit inline-block col-span-1 col-start-1 row-start-1 @2xl:flex-none">
// 						<button className="cursor-pointer items-center border-none justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white ring-inset ring-1 ring-gray-300 shadow-xs bg-blue-500 hover:bg-blue-300 focus:outline-offset-2 px-3 py-2 outline-gray-300 text-sm gap-2 inline-flex">
// 							<ListFilter className="h-4 w-4" />
// 							Filtros
// 							{activeFilters.length > 0 && (
// 								<Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5">
// 									{activeFilters.length}
// 								</Badge>
// 							)}
// 						</button>
// 					</div>
// 				</PopoverTrigger>
// 				<PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
// 					<div className="p-4 space-y-4">
// 					{/* Header con opciones */}
// 					<div className="flex items-center justify-between">
// 						<h4 className="font-semibold text-sm flex items-center gap-2">
// 							Filtros
// 							{activeFilters.length > 0 && (
// 								<Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5">
// 									{activeFilters.length}
// 								</Badge>
// 							)}
// 						</h4>
// 						<div className="flex items-center gap-2">
// 							{activeFilters.length > 0 && (
// 								<Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
// 									Borrar todo
// 								</Button>
// 							)}
// 						</div>
// 					</div>

// 					{/* Filtros activos */}
// 					{activeFilters.length > 0 && (
// 						<div className="space-y-2">
// 							{activeFilters.map((filter) => (
// 								<div
// 									key={filter.id}
// 									className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
// 								>
// 								<div className="flex-1 min-w-0">
// 									<div className="text-xs font-medium text-muted-foreground">{filter.label}</div>
// 									<div className="text-sm truncate">{filter.value}</div>
// 								</div>
// 								<Button
// 									variant="ghost"
// 									size="icon"
// 									className="h-6 w-6 shrink-0"
// 									onClick={() => removeFilter(filter.id)}
// 								>
// 									<X className="h-3 w-3" />
// 								</Button>
// 								</div>
// 							))}
// 							<Separator />
// 						</div>
// 					)}

// 					{/* Si hay un filtro seleccionado, mostrar el formulario */}
// 					{selectedFilterType ? (
// 						<div className="space-y-3">
// 							<div className="flex items-center justify-between">
// 								<Label className="text-sm font-medium">
// 									{availableFilters.find((f) => f.id === selectedFilterType)?.label}
// 								</Label>
// 								<Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFilterType(null)}>
// 									<X className="h-3 w-3" />
// 								</Button>
// 							</div>

// 							{/* Formulario según el tipo de filtro */}
// 							{/* TEXT */}
// 							{availableFilters.find((f) => f.id === selectedFilterType)?.type === "text" && (
// 								<Input
// 									placeholder="Ingrese valor..."
// 									value={tempFilterValue}
// 									onChange={(e) => setTempFilterValue(e.target.value)}
// 									onKeyDown={(e) => {
// 										if (e.key === "Enter") confirmFilter()
// 									}}
// 								/>
// 							)}

// 							{/* NUMBER */}
// 							{availableFilters.find((f) => f.id === selectedFilterType)?.type === "number" && (
// 								<Input
// 									type="number"
// 									placeholder="Ingrese monto..."
// 									value={tempFilterValue}
// 									onChange={(e) => setTempFilterValue(e.target.value)}
// 									onKeyDown={(e) => {
// 										if (e.key === "Enter") confirmFilter()
// 									}}
// 								/>
// 							)}

// 							{/* SELECT */}
// 							{availableFilters.find((f) => f.id === selectedFilterType)?.type === "select" && (
// 								<Select value={tempFilterValue} onValueChange={setTempFilterValue}>
// 									<SelectTrigger>
// 										<SelectValue placeholder="Seleccionar..." />
// 									</SelectTrigger>
// 									<SelectContent>

// 										{setSelectData(selectedFilterType)
// 											.filter((d) => d !== "")
// 											.map((d) => (
// 											<SelectItem key={d} value={d}>{d}</SelectItem>
// 										))}
										
// 									</SelectContent>
// 								</Select>
// 							)}

// 							{availableFilters.find((f) => f.id === selectedFilterType)?.type === "date" && (
// 								<div className="space-y-2">
// 									<div>
// 										<Label className="text-xs text-muted-foreground">Desde</Label>
// 										<Popover>
// 											<PopoverTrigger asChild>
// 												<Button
// 													variant="outline"
// 													className="w-full justify-start text-left font-normal bg-transparent"
// 													>
// 													<CalendarIcon className="mr-2 h-4 w-4" />
// 													{tempDateFrom ? format(tempDateFrom, "PPP", { locale: es }) : "Seleccionar fecha"}
// 												</Button>
// 											</PopoverTrigger>
// 											<PopoverContent className="w-auto p-0" align="start">
// 												<Calendar mode="single" selected={tempDateFrom} onSelect={setTempDateFrom} initialFocus />
// 											</PopoverContent>
// 										</Popover>
// 									</div>
// 									<div>
// 										<Label className="text-xs text-muted-foreground">Hasta</Label>
// 										<Popover>
// 											<PopoverTrigger asChild>
// 												<Button
// 													variant="outline"
// 													className="w-full justify-start text-left font-normal bg-transparent"
// 												>
// 												<CalendarIcon className="mr-2 h-4 w-4" />
// 													{tempDateTo ? format(tempDateTo, "PPP", { locale: es }) : "Seleccionar fecha"}
// 												</Button>
// 											</PopoverTrigger>
// 											<PopoverContent className="w-auto p-0" align="start">
// 												<Calendar mode="single" selected={tempDateTo} onSelect={setTempDateTo} initialFocus />
// 											</PopoverContent>
// 										</Popover>
// 									</div>
// 								</div>
// 							)}

// 							<Button onClick={confirmFilter} className="w-full bg-[#3B82F6] hover:bg-[#2F7DE7] text-white" size="sm">
// 								Aplicar filtro
// 							</Button>
// 						</div>
// 					) : (
// 						<>
// 							{/* Búsqueda de filtros */}
// 							<div className="relative">
// 								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
// 								<Input
// 									placeholder="Filter by ..."
// 									value={filterSearchQuery}
// 									onChange={(e) => setFilterSearchQuery(e.target.value)}
// 									className="pl-9"
// 								/>
// 							</div>

// 							{/* Lista de filtros disponibles */}
// 							<div className="max-h-[300px] overflow-y-auto space-y-1">
// 								{filteredAvailableFilters.map((filter) => {
// 								const Icon = filter.icon
// 								return (
// 									<button
// 										key={filter.id}
// 										onClick={() => addFilter(filter.id)}
// 										className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent transition-colors text-left"
// 									>
// 										<Icon className="h-4 w-4 text-muted-foreground shrink-0" />
// 										<span className="text-sm">{filter.label}</span>
// 									</button>
// 								)
// 								})}
// 							</div>
// 							<Button onClick={applyFilters} className="w-full bg-[#3B82F6] hover:bg-[#2F7DE7] text-white" size="sm">
// 								Aplicar filtro
// 							</Button>
// 						</>
// 					)}
// 					</div>
// 				</PopoverContent>
//             </Popover>
//         </>
//     )
// }

import { useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import useFilter from "@/hooks/useFilter";
// import { activeFiltersToParams } from "@/utils/filterUtils";
import {
    Search,
    ListFilter,
    X,
    CalendarIcon,
} from "lucide-react";
import { activeFiltersToParams } from "@/lib/filterUtils";

function getOptionValue(option) {
    if (option && typeof option === "object") {
        return option.value;
    }

    return option;
}

function getOptionLabel(option) {
    if (option && typeof option === "object") {
        return option.label ?? option.value;
    }

    return option;
}

export default function FilterAdvanced({
    columns = [],
    availableFilters = [],
    data = [],

    activeFilters,
    onActiveFiltersChange,

    onChange,
    output = "params",
    defaultParams = {},

    showFiltersInsidePopover = true,
}) {
    const {
        activeFilters: currentActiveFilters,
        filteredAvailableFilters,

        selectedFilterType,
        setSelectedFilterType,

        filterSearchQuery,
        setFilterSearchQuery,

        tempFilterValue,
        setTempFilterValue,

        tempDateFrom,
        setTempDateFrom,

        tempDateTo,
        setTempDateTo,

        filterPopoverOpen,
        setFilterPopoverOpen,

        addFilter,
        confirmFilter,
        removeFilter,
        clearAllFilters,
    } = useFilter({
        columns,
        availableFilters,
        activeFilters,
        onActiveFiltersChange,
    });

    const selectedFilterDef = useMemo(() => {
        return availableFilters.find((filter) => filter.id === selectedFilterType);
    }, [availableFilters, selectedFilterType]);

    // const paramsPayload = useMemo(() => {
    //     return activeFiltersToParams(currentActiveFilters, {
    //         defaults: defaultParams,
    //         omitEmpty: true,
    //     });
    // }, [currentActiveFilters, defaultParams]);

    // useEffect(() => {
    //     if (output === "array") {
    //         onChange?.(currentActiveFilters);
    //         return;
    //     }

    //     onChange?.(paramsPayload);
    // }, [currentActiveFilters, paramsPayload, output, onChange]);

    function getSelectOptions(filterId) {
        const filterDef = availableFilters.find((filter) => filter.id === filterId);

        if (Array.isArray(filterDef?.options)) {
            return filterDef.options;
        }

        const set = new Set(
            data
                .map((item) => item?.[filterId])
                .filter((value) => value != null && value !== "")
        );

        return Array.from(set).sort((a, b) =>
            String(a).localeCompare(String(b))
        );
    }

    return (
        <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-fit inline-block col-span-1 col-start-1 row-start-1 @2xl:flex-none">
                    <button
                        type="button"
                        className="cursor-pointer items-center border-none justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white ring-inset ring-1 ring-gray-300 shadow-xs bg-blue-500 hover:bg-blue-300 focus:outline-offset-2 px-3 py-2 outline-gray-300 text-sm gap-2 inline-flex"
                    >
                        <ListFilter className="h-4 w-4" />
                        Filtros

                        {currentActiveFilters.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="ml-1 h-5 min-w-5 rounded-full px-1.5"
                            >
                                {currentActiveFilters.length}
                            </Badge>
                        )}
                    </button>
                </div>
            </PopoverTrigger>

            <PopoverContent
                className="w-[calc(100vw-2rem)] sm:w-[400px] p-0"
                align="start"
            >
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            Filtros

                            {currentActiveFilters.length > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="h-5 min-w-5 rounded-full px-1.5"
                                >
                                    {currentActiveFilters.length}
                                </Badge>
                            )}
                        </h4>

                        {currentActiveFilters.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="h-7 text-xs"
                            >
                                Borrar todo
                            </Button>
                        )}
                    </div>

                    {showFiltersInsidePopover && currentActiveFilters.length > 0 && (
                        <div className="space-y-2">
                            {currentActiveFilters.map((filter) => (
                                <div
                                    key={filter.id}
                                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 border"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-muted-foreground">
                                            {filter.label}
                                        </div>

                                        <div className="text-sm truncate">
                                            {filter.value}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => removeFilter(filter.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}

                            <Separator />
                        </div>
                    )}

                    {selectedFilterType ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                    {selectedFilterDef?.label}
                                </Label>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setSelectedFilterType(null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>

                            {selectedFilterDef?.type === "text" && (
                                <Input
                                    placeholder="Ingrese valor..."
                                    value={tempFilterValue}
                                    onChange={(e) => setTempFilterValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") confirmFilter();
                                    }}
                                />
                            )}

                            {selectedFilterDef?.type === "number" && (
                                <Input
                                    type="number"
                                    placeholder="Ingrese monto..."
                                    value={tempFilterValue}
                                    onChange={(e) => setTempFilterValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") confirmFilter();
                                    }}
                                />
                            )}

                            {selectedFilterDef?.type === "select" && (
                                <Select
                                    value={tempFilterValue}
                                    onValueChange={setTempFilterValue}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {getSelectOptions(selectedFilterType).map((option) => {
                                            const value = getOptionValue(option);
                                            const label = getOptionLabel(option);

                                            return (
                                                <SelectItem
                                                    key={String(value)}
                                                    value={String(value)}
                                                >
                                                    {label}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}

                            {selectedFilterDef?.type === "date" && (
                                <div className="space-y-2">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Desde
                                        </Label>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal bg-transparent"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />

                                                    {tempDateFrom
                                                        ? tempDateFrom.toLocaleDateString("es-PE")
                                                        : "Seleccionar fecha"}
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={tempDateFrom}
                                                    onSelect={setTempDateFrom}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <Label className="text-xs text-muted-foreground">
                                            Hasta
                                        </Label>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal bg-transparent"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />

                                                    {tempDateTo
                                                        ? tempDateTo.toLocaleDateString("es-PE")
                                                        : "Seleccionar fecha"}
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={tempDateTo}
                                                    onSelect={setTempDateTo}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={confirmFilter}
                                className="w-full bg-[#3B82F6] hover:bg-[#2F7DE7] text-white"
                                size="sm"
                            >
                                Aplicar filtro
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Filtrar por..."
                                    value={filterSearchQuery}
                                    onChange={(e) => setFilterSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {filteredAvailableFilters.map((filter) => {
                                    const Icon = filter.icon;

                                    return (
                                        <button
                                            type="button"
                                            key={filter.id}
                                            onClick={() => addFilter(filter.id)}
                                            className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent transition-colors text-left"
                                        >
                                            {Icon && (
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}

                                            <span className="text-sm">
                                                {filter.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}