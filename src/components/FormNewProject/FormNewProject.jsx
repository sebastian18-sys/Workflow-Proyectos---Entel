import { useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarIcon, Plus, SearchX, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { Textarea } from "../ui/textarea"
import { cn } from "@/lib/utils"

function formatDate(d) {
    if (!d) return ""
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
}

function DateField({
    label,
    value,
    onChange,
    placeholder = "dd/mm/yyyy"
}) {
    return (
        <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Popover>
            <PopoverTrigger asChild>
            <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
            >
                <span>{value ? formatDate(value) : placeholder}</span>
                <CalendarIcon className="h-4 w-4" />
            </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
                <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
            </PopoverContent>
        </Popover>
        </div>
    )
}


export function FormNewProject() {
    const [open, setOpen] = useState(false)

    // Catálogos demo (reemplaza por tus datos)
    const tipoProyectoOptions = ["COSITE", "TRANSPORTE", "MACRO", "OPERATIVO", "COMERCIAL", "INDOOR", "GCIR", "OTROS"]
    const pmOptions = ["Sebastian", "Jason", "Luis", "Andrea"]
    const sponsorOptions = ["GCIR", "GIRA", "CORE"]
    const jefaturaOptions = ["AYA", "Nodos y Tx", "OOCC y OOEE", "PMO"]

    const initialForm = {
        nombre: "",
        alcance: "",
        proposito: "",
        tipoProyecto: "",
        projectManager: "",
        sponsor: "",
        jefatura: "",
        fechaInicioIniciativa: undefined,
        fechaFinCI: undefined,
        fechaFinSOLPE: undefined,
        fechaFinEjecucion: undefined,
        fechaFinCierre: undefined,
    }

    // Form state (mínimo)
    const [form, setForm] = useState(initialForm)
    const [assignments, setAssignments] = useState([])

    const addAssignment = () => {
        if (!form.tipoProyecto || !form.projectManager) return
        setAssignments((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                tipoProyecto: form.tipoProyecto,
                projectManager: form.projectManager,
                fecha: new Date(),
            },
        ])
    }

    const removeAssignment = (id) => {
        setAssignments((prev) => prev.filter((a) => a.id !== id))
    }

    const onSubmit = (e) => {
        e.preventDefault()

        // Aquí llamas a tu API
        const payload = { ...form, assignments }
        console.log("NEW PROJECT:", payload)

        // Cierra modal (o muestra toast)
        // Clear form
        setForm(initialForm)
        setAssignments([])

        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {/* Trigger: botón “+” */}
            <DialogTrigger asChild>
                <Button size="icon" className="cursor-pointer items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid text-violet-900 hover:text-violet-900 bg-blue-500 hover:bg-blue-400 focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 text-sm leading-6 px-3 py-2 gap-2 inline-flex w-10 2xl:w-auto">
                    
                    <Plus className="h-6 w-6 text-white" />
                    <span className=" text-white">Proyecto</span>
                </Button>
            </DialogTrigger>

            {/* Content */}
            <DialogContent className="p-0 sm:max-w-5xl max-h-[85vh] overflow-hidden">
                {/* Header (barra superior como Figura 2) */}
                <DialogHeader className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-sm font-semibold text-blue-500 pb-2">
                                Crear Iniciativa
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Completa la información para registrar un nuevo proyecto.
                            </DialogDescription>
                        </div>

                        {/* <div className="flex items-center gap-2">
                            <Button type="submit" form="new-project-form" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Crear
                            </Button>
                        </div> */}
                    </div>
                </DialogHeader>

                <Separator />

                {/* Body scrollable */}
                <div className="max-h-[calc(85vh-120px)] overflow-y-auto">
                    <form id="new-project-form" onSubmit={onSubmit} className="px-6 py-5 space-y-6">
                        {/* === PROYECTO === */}
                        <section className="space-y-4">
                            <h3 className="text-[13px] font-semibold text-blue-400">Proyecto</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Nombre <span className="text-red-400">*</span></Label>
                                    <Input
                                        className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                        placeholder="Ingresa nombre de Iniciativa"
                                        value={form.nombre}
                                        required
                                        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Alcance <span className="text-red-400">*</span></Label>
                                    <Input
                                        className="focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                        placeholder="Ingresa el alcance de la iniciativa"
                                        value={form.alcance}
                                        required
                                        onChange={(e) => setForm((p) => ({ ...p, alcance: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Propósito / Justificación</Label>
                                <Textarea
                                    placeholder="Ingresar propósito"
                                    className="min-h-[70px] focus-visible:border-blue-500 focus-visible:border-2 focus-visible:ring-0"
                                    value={form.proposito}
                                    onChange={(e) => setForm((p) => ({ ...p, proposito: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Tipo Proyecto: <span className="text-red-400">*</span></Label>
                                    <Select
                                        required
                                        value={form.tipoProyecto}
                                        onValueChange={(v) => setForm((p) => ({ ...p, tipoProyecto: v }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tipoProyectoOptions.map((o) => (
                                                <SelectItem key={o} value={o}>
                                                {o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>    
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Project Manager: <span className="text-red-400">*</span></Label>
                                    <Select
                                        value={form.projectManager}
                                        onValueChange={(v) => setForm((p) => ({ ...p, projectManager: v }))}
                                    >
                                        <SelectTrigger required className="w-full">
                                            <SelectValue placeholder="Seleccionar PM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pmOptions.map((o) => (
                                                <SelectItem key={o} value={o}>
                                                {o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Botón + al lado */}
                                <div className="flex items-end">
                                <Button
                                    type="button"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-blue-500 hover:bg-blue-400 cursor-pointer"
                                    onClick={addAssignment}
                                    title="Añadir"
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                                </div>
                            </div>

                            {/* Tabla */}
                            <div className="rounded-xl border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">Tipo Proyecto</TableHead>
                                            <TableHead className="text-xs">Project Manager</TableHead>
                                            <TableHead className="text-xs">Fecha</TableHead>
                                            <TableHead className="text-xs text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="mb-4 text-gray-300">
                                                        <SearchX className="h-10 w-10" />
                                                    </div>
                                                    <div className="text-gray-300">Sin Resultados</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        ) : (
                                        assignments.map((a) => (
                                            <TableRow key={a.id}>
                                                <TableCell className="text-sm">{a.tipoProyecto}</TableCell>
                                                <TableCell className="text-sm">{a.projectManager}</TableCell>
                                                <TableCell className="text-sm">{formatDate(a.fecha)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeAssignment(a.id)}
                                                        aria-label="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>

                        <Separator />

                        {/* === SPONSOR === */}
                        <section className="space-y-4">
                            <h3 className="text-[13px] font-semibold text-blue-400">Sponsor</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Sponsor:</Label>
                                    <Select
                                        value={form.sponsor}
                                        onValueChange={(v) => setForm((p) => ({ ...p, sponsor: v }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar Sponsor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sponsorOptions.map((o) => (
                                                <SelectItem key={o} value={o}>
                                                {o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Jefatura:</Label>
                                    <Select
                                        value={form.jefatura}
                                        onValueChange={(v) => setForm((p) => ({ ...p, jefatura: v }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar Jefatura" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jefaturaOptions.map((o) => (
                                                <SelectItem key={o} value={o}>
                                                {o}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* === PLANIFICACIÓN === */}
                        <section className="space-y-4">
                            <h3 className="text-[13px] font-semibold text-blue-400">Planificación</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DateField
                                    label="Fecha inicio Iniciativa:"
                                    value={form.fechaInicioIniciativa}
                                    onChange={(d) => setForm((p) => ({ ...p, fechaInicioIniciativa: d }))}
                                />
                                <DateField
                                    label="Fecha Fin C.I:"
                                    value={form.fechaFinCI}
                                    onChange={(d) => setForm((p) => ({ ...p, fechaFinCI: d }))}
                                />
                                <DateField
                                    label="Fecha Fin SOLPE:"
                                    value={form.fechaFinSOLPE}
                                    onChange={(d) => setForm((p) => ({ ...p, fechaFinSOLPE: d }))}
                                />
                                <DateField
                                    label="Fecha Fin Ejecución"
                                    value={form.fechaFinEjecucion}
                                    onChange={(d) => setForm((p) => ({ ...p, fechaFinEjecucion: d }))}
                                />
                                <DateField
                                    label="Fecha Fin Cierre"
                                    value={form.fechaFinCierre}
                                    onChange={(d) => setForm((p) => ({ ...p, fechaFinCierre: d }))}
                                />
                            </div>
                        </section>

                        {/* Footer inferior */}
                        <DialogFooter className="gap-2 pt-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="cursor-pointer">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button type="submit" className="gap-2 bg-blue-500 hover:bg-blue-400 cursor-pointer">
                                <Plus className="h-4 w-4" />
                                Crear
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}