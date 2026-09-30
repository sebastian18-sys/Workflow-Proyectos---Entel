import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "wc-toast";
import { Settings2, FileSpreadsheet, FileText, LayoutList } from "lucide-react"
import { Spinner } from "../ui/spinner"

export default function MoreOptions({ 
    itemsPerPage, setItemsPerPage, 
    sortBy, setSortBy, 
    sortDirection, setSortDirection, 
    template, fileName, queryParams, totalResults, service, transformData, exportData 
}) {

    const [loading, setLoading] = useState(false)
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

    const exportParams = {
        ...queryParams,
        page: 1,
        limit: totalResults || 1,
    };

    const handleDownloadXlsx = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)

            const res = await service(exportParams);
            const allRows = res?.content?.items || [];
            const transformProject = allRows.map(transformData);

            await exportData({
                templatePath: template,
                dataFinal: transformProject,
                fileName: fileName
            })
            setLoading(false)
            // popover close
            setFilterPopoverOpen(false)
            toast.success("Descarga completa!")
        } catch (error) {
            console.log(error)
            setLoading(false)
            setFilterPopoverOpen(false)
            toast.error("Error al descargar reporte")
        }
        
    }

    return (
        <>
            <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-white ring-inset ring-1 ring-gray-300 shadow-xs dark:shadow-none bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-gray-300  text-sm leading-6 px-3 py-2 gap-2 inline-flex" size="icon">
                        <LayoutList className="h-4 w-4" />
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
                                {/* Button disabled if loading is true */}
                                
                                <button
                                    className="flex w-full items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded-md px-2 py-1.5 transition-colors"
                                    onClick={(e) => {handleDownloadXlsx(e)}}
                                    disabled={loading}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    {/* {loading ? <Spinner /> : "Descargar XLSX"} */}
                                    {/* Descargar XLSX */}
                                    {loading ? <Spinner /> : "Descargar XLSX"}
                                </button>
                                <button
                                    className="flex w-full items-center gap-2 text-sm hover:bg-accent rounded-md px-2 py-1.5 transition-colors"
                                    onClick={() => {}}
                                    disabled
                                >
                                    <FileText className="h-4 w-4" />
                                    Descargar CSV
                                </button>
                            </div>
                        </div>

                        <Separator />

                        {/* CLOSE POPOVER */}
                        <Button onClick={() => setFilterPopoverOpen(false)} variant="outline" size="sm" className="w-full bg-transparent">
                            Cerrar
                        </ Button>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    )
}       