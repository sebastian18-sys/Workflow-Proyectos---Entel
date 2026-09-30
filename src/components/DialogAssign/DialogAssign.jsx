import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import MultiSelectFilter from "../ui/_multiselect3";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useEffect, useMemo } from "react";
import { useAuthz } from "@/hooks/useAuthz";
import { useOCbyProy } from "@/hooks/budget/capex/useOCbyProy";

export default function DialogAssign({
    open,
    onOpenChange,
    user
}) {

    

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1200px]">
                <DialogHeader>
                    <DialogTitle className="text-[#2b7fff]">Vista previa de datos filtrados</DialogTitle>
                    {/* <div className="flex gap-4 my-4">
                        <MultiSelectFilter
                            label="Proyecto"
                            icon={Briefcase}
                            options={proyectoOptions}
                            selected={filtroProyecto}
                            onChange={setFiltroProyecto}
                            placeholder="Seleccionar proyecto"
                        />
                        <MultiSelectFilter
                            label="Línea de inversión"
                            icon={Briefcase}
                            options={lineaInversionOptions}
                            selected={filtroLineaInversion}
                            onChange={setFiltroLineaInversion}
                            placeholder="Seleccionar línea"
                        />
                        <div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Search className="h-4 w-4 text-[#2b7fff]" />
                                    Búsqueda por OC
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={searchOC}
                                        onChange={(e) => setSearchOC(e.target.value)}
                                        placeholder="OC..."
                                        className="h-11 rounded-2xl border-slate-200 pl-9"
                                        aria-label="Búsqueda rápida"
                                    />
                                </div>
                            </div>
                        </div>
                    </div> */}
                </DialogHeader>

                <div className="max-h-[500px] overflow-auto rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-20 backdrop-blur border-b-2">
                            <tr className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
                                <th className="w-[60px] px-3 py-3 text-left">
                                    <Checkbox
                                        checked={allSelectableChecked ? true : someSelectableChecked ? "indeterminate" : false}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Seleccionar todos"
                                    />
                                </th>
                                <th className="px-3 min-w-[120px] py-3 text-left text-[#64748B] font-semibold">Identificador</th>
                                <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Site</th>
                                <th className="px-3 min-w-[150px] py-3 text-left text-[#64748B] font-semibold">Proyecto</th>
                                <th className="px-3 min-w-[100px] py-3 text-left text-[#64748B] font-semibold">OC</th>
                                <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Coordinador Actual</th>
                                <th className="px-3 py-3 text-left text-[#64748B] font-semibold">Coordinaodr a Asignar</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            {/* {loadingPreview ? (
                                Array.from({ length: 6 }).map((_, rowIdx) => (
                                <tr key={`skeleton-${rowIdx}`}>
                                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                                        <Skeleton className="h-4 w-[90%]" />
                                    </td>        
                                </tr>
                            ))  
                            ) : previewRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                                        No se encontraron registros para esos filtros.
                                    </td>
                                </tr>
                            ) : (
                            previewRows.map((row) => (

                                selectedHito === "hito1" ? (
                                    <PreviewTableRow
                                        key={row.id}
                                        row={row}
                                        editable={canEditHito(row)}
                                        onToggleRow={toggleRow}
                                        onCommitHito={handleHitoCommit}
                                        formatCurrency={formatCurrency}
                                    />
                                ) : (
                                    <PreviewTableRowH2
                                        key={row.id}
                                        row={row}
                                        editable={canEditHito(row)}
                                        onToggleRow={toggleRow}
                                        onCommitHito={handleHitoCommitH2}
                                        formatCurrency={formatCurrency}
                                    />
                                )
                                
                            ))
                            )} */}
                        </tbody>
                    </table>
                </div>

                <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
                    {/* <div className="text-sm text-muted-foreground">
                        Seleccionados:{" "}
                        <span className="font-semibold text-[#2b7fff]">
                            {previewRows.filter((r) => r.selected).length}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            Cerrar
                        </Button>

                        <Button
                            onClick={() => {
                                const rowsToProcess = previewRows.filter((r) => r.selected);
                                handleProcess(rowsToProcess);
                            }}
                            disabled={previewRows.every((r) => !r.selected)}
                        >
                            Procesar seleccionados
                        </Button>
                    </div> */}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}