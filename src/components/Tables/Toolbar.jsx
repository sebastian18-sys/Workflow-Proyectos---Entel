import { useState } from "react"
import { FileSpreadsheet, FileText, MoreVertical, Search, Settings2 } from "lucide-react"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import FilterAdvanced from "../Filters/FilterAdvanced";
import useTableTool from "@/hooks/useTableTool"


export default function Toolbar({ value, columns, availableFilters, onChange, config, total }) {

    const isVisible = (key) => !config.visibleKeys || config.visibleKeys.includes(key)
    const setField = (k, v) => onChange({ ...value, [k]: v })

    // // Order and Direction
    // const [sortBy, setSortBy] = useState("nombre")
    // const [sortDirection, setSortDirection] = useState("asc")
    // // Columns Visibility
    // const [visibleColumns, setVisibleColumns] = useState(
    //     columns.reduce((acc, col) => ({ ...acc, [col.id]: col.visible }), {}),
    // )

    // const toggleColumn = (columnId) => {
    //     setVisibleColumns((prev) => ({
    //         ...prev,
    //         [columnId]: !prev[columnId],
    //     }))
    // }

	const {
		itemsPerPage,
		setItemsPerPage,
		visibleColumns,
		toggleColumn,
		sortBy,
		setSortBy,
		sortDirection,
		setSortDirection,
	} = useTableTool({ columns })

    return (
        <>
            {/* Toolbar */}
			<div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center py-2 gap-3">
				
				{/* Filtros avanzados */}
				<FilterAdvanced columns={columns} availableFilters={availableFilters} />

				{/* Búsqueda */}
                {config.search && isVisible("search") && ( 
                    <div className="relative flex-1 min-w-full sm:min-w-[200px] sm:max-w-[300px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar"
                            value={value.search ?? ""}
                            onChange={(e) => setField("search", e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}

                {/* Selects Opcionales */}
                {config.selects?.map(select =>
                    isVisible(select.key) ? (
                        <Select 
                            key={select.key}
                            value={value[select.key] ?? ""} 
                            onValueChange={v => setField(select.key, v)}
                        >
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue placeholder={select.label} />
                            </SelectTrigger>
                            <SelectContent>
                                {select.options.map(option => (
                                    <SelectItem value={option} key={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : null
                )}

				<div className="flex items-center justify-between sm:justify-start gap-6 sm:ml-auto">
					
					{/* Resultados */}
					<div className="flex items-center gap-2">
						<span className="text-sm font-bold">{total}</span>
						<span className="text-sm text-muted-foreground">resultados</span>
					</div>

					{/* Mas Opciones */}
					<Popover>
						<PopoverTrigger asChild>
						<Button variant="outline" className="bg-[#3B82F6] hover:bg-[#2F7DE7] text-white hover:text-white" size="icon">
							<MoreVertical className="h-4 w-4" />
						</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[calc(100vw-2rem)] sm:w-[280px]" align="end">
							<div className="space-y-4">
								<div>
									<h4 className="font-medium text-sm mb-3">Visualización</h4>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
                                            <Label htmlFor="pagination" className="text-sm font-normal">
                                                Paginación
                                            </Label>
                                            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                                                <SelectTrigger id="pagination" className="w-[100px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="20">20</SelectItem>
                                                    <SelectItem value="30">30</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="100">100</SelectItem>
                                                </SelectContent>
                                            </Select>
										</div>

										<div className="flex items-center justify-between">
										<Label htmlFor="sort-by" className="text-sm font-normal">
											Ordenar por
										</Label>
										<Select value={sortBy} onValueChange={setSortBy}>
											<SelectTrigger id="sort-by" className="w-[100px] h-8">
											    <SelectValue />
											</SelectTrigger>
											<SelectContent>
                                                <SelectItem value="nombre">Nombre</SelectItem>
                                                <SelectItem value="codigo">Código</SelectItem>
                                                <SelectItem value="proyecto">Proyecto</SelectItem>
											</SelectContent>
										</Select>
										</div>

										<div className="flex items-center justify-between">
										<Label htmlFor="direction" className="text-sm font-normal">
											Dirección
										</Label>
										<Select value={sortDirection} onValueChange={setSortDirection}>
											<SelectTrigger id="direction" className="w-[100px] h-8">
											    <SelectValue />
											</SelectTrigger>
											<SelectContent>
                                                <SelectItem value="asc">Ascendente</SelectItem>
                                                <SelectItem value="desc">Descendente</SelectItem>
											</SelectContent>
										</Select>
										</div>
									</div>
								</div>

								<Separator />

								<div>
									<button
										className="flex w-full items-center gap-2 text-sm hover:bg-accent rounded-md px-2 py-1.5 transition-colors"
										onClick={() => {}}
									>
										<Settings2 className="h-4 w-4" />
										Personalizar columnas
									</button>
								</div>

								<Separator />

								<div>
									<h4 className="font-medium text-sm mb-2">Exportar datos</h4>
									<div className="space-y-1">
										<button
										    className="flex w-full items-center gap-2 text-sm hover:bg-accent rounded-md px-2 py-1.5 transition-colors"
										    onClick={() => {}}
										>
										    <FileSpreadsheet className="h-4 w-4" />
										    Descargar XLSX
										</button>
										<button
										    className="flex w-full items-center gap-2 text-sm hover:bg-accent rounded-md px-2 py-1.5 transition-colors"
										    onClick={() => {}}
										>
										    <FileText className="h-4 w-4" />
										    Descargar CSV
										</button>
									</div>
								</div>

								<Separator />

								<Button variant="outline" size="sm" className="w-full bg-transparent">
									Cerrar
								</ Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>
        </>
    )
}