import { useMemo, useState } from "react"
import { useProjectsOpex } from "@/hooks/budget/capex/useProjectsOpex"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DownloadCloud } from "lucide-react"
import { buildArriendosResumenForTemplate, buildArriendosRowForTemplate, exportArriendosToXlsx } from "@/lib/exportExcel"
import { formatNumberInt, unique, uniqueNum } from "@/lib/helpers"
import { MultiSelect } from "@/components/ui/_multiselect"
import { MultiSelect2 } from "@/components/ui/_multiselect2"


const MONTH_KEYS = {
    "Ene": 1,
    "Feb": 2,
    "Mar": 3,
    "Abr": 4,
    "May": 5,
    "Jun": 6,
    "Jul": 7,
    "Ago": 8,
    "Set": 9,
    "Oct": 10,
    "Nov": 11,
    "Dic": 12
};

const MONTH_ORDER = Object.keys(MONTH_KEYS)
const MONTH_ITERATE = Object.values(MONTH_KEYS)
const TC = 3.7

/** ===== Filtros anidados ===== */
function useFilters(data) {

    console.log("DATA", data)

    const [anio, setAnio] = useState(2025);
    const [proyecto, setProyecto] = useState("Todos");
    const apply = (omit) => (d) => {
        const byAnio = omit === "anio" || d.year === anio;
        const byProy = omit === "proyecto" || proyecto === "Todos" || d.projectName === proyecto;
        return byAnio && byProy;
    };

    const options = {
        anio: useMemo(() => uniqueNum(data.filter(apply("anio")).map(d => d.year)), [data, proyecto]),
        proyecto: useMemo(() => unique(data.filter(apply("proyecto")).map(d => d.projectName)), [data, anio]),
    };

    const filtered = useMemo(() => data.filter(apply("")), [data, anio, proyecto]);

    return { 
        options, 
        filtered,
        anio, setAnio,
        proyecto, setProyecto
    };
}

function ResumenOpex({ data }) {

    let qSitios, montoConsumido, montoDisponible, porcentajeDisponible = 0

    return (
        <div className="space-y-10">
            <div className="overflow-x-auto border-t-1">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="text-[#101828] uppercase">Proyecto</TableHead>
                        <TableHead className="text-center text-[#101828] uppercase">Q Real Sitios</TableHead>
                        <TableHead className="text-right text-[#101828] uppercase">Presupuesto Habilitado</TableHead>
                        <TableHead className="text-right text-[#101828] uppercase">Monto Consumido (Soles)</TableHead>
                        <TableHead className="text-right text-[#101828] uppercase">Monto Disponible (Soles)</TableHead>
                        <TableHead className="text-right text-[#101828] uppercase">% Disponible</TableHead>
                    </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.map((proy) => {

                            const debitoReal = proy.cashFlow.filter(f => f.type === "Débito REAL")
                            
                            qSitios = proy.cashFlow.length > 0 ? debitoReal.length : 0
                            montoConsumido = proy.cashFlow.length > 0 ? debitoReal.reduce((s, it) => s + (it.currency === "Dólares" ? it.annualCost * TC : it.annualCost), 0) : 0
                            montoDisponible = proy.budget - montoConsumido
                            porcentajeDisponible = proy.budget !== 0 ? montoDisponible / proy.budget * 100 : 0

                            return (
                            <>
                                <TableRow key={proy.projectName}>
                                    <TableCell className="font-medium">{proy.projectName}</TableCell>
                                    <TableCell className="text-center">{qSitios}</TableCell>
                                    <TableCell className="text-right">{formatNumberInt(proy.budget)}</TableCell>
                                    <TableCell className="text-right">{formatNumberInt(montoConsumido)}</TableCell>
                                    <TableCell className="text-right">{formatNumberInt(montoDisponible)}</TableCell>
                                    <TableCell className={`text-right ${porcentajeDisponible < 30 ? "text-red-600" : porcentajeDisponible < 70 ? "text-yellow-600" : "text-green-600"}`}>
                                        {porcentajeDisponible.toFixed(1)} %
                                    </TableCell>
                                </TableRow>
                            </>
                        )})}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function DetallesOpex({ data }) {

    return (
        <div className="space-y-10">
            <div className="overflow-x-auto border-t-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-[#101828] uppercase">Proyecto</TableHead>
                            <TableHead className="text-center text-[#101828] uppercase">ID</TableHead>
                            <TableHead className="text-[#101828] uppercase">Sitio</TableHead>
                            <TableHead className="text-center text-[#101828] uppercase">Torrera</TableHead>
                            <TableHead className="text-center text-[#101828] uppercase">Monto Mensual</TableHead>
                            <TableHead className="text-right text-[#101828] uppercase">Moneda</TableHead>
                            {MONTH_ORDER.map((m) => (
                                <TableHead key={m} className="whitespace-nowrap text-right font-medium">
                                    {m}
                                </TableHead>
                            ))}
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.map((proy) => (
                            <>
                                {proy.cashFlow.filter(f => f.type === "Débito REAL").map((fila) => (
                                    <TableRow key={fila._id}>
                                        <TableCell className="font-medium">{proy.projectName}</TableCell>
                                        <TableCell className="text-center">{fila.id}</TableCell>
                                        <TableCell className="text-left">{fila.subProjectName}</TableCell>
                                        <TableCell className="text-center">{fila.torrera}</TableCell>
                                        <TableCell className="text-center">{formatNumberInt(fila.monthlyCost)}</TableCell>
                                        <TableCell className="text-center">{fila.currency}</TableCell>
                                        {MONTH_ITERATE.map((m) => (
                                            <TableCell key={m} className="text-right">
                                                {m >= fila.initMonth + 1 ? formatNumberInt(fila.monthlyCost) : ""}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right font-bold">{formatNumberInt(fila.annualCost)}</TableCell>
                                    </TableRow>
                                ))}
                            </>
                        ))}
                    </TableBody>
                </Table>
        
            </div>
        </div>
    );
}

export default function RentasOpex() {

    const projectsOpex = useProjectsOpex()
    const flt = useFilters(projectsOpex);

    
    
    let dataToExport = flt.filtered.flatMap(item => {
        const { cashFlow, ...parentData } = item; 

        return cashFlow.map(cf => ({
            ...parentData, 
            ...cf,         
        }));
    });

    console.log(flt)

    let projectsMultiselect = []
    flt.options.proyecto.map(p => {
        projectsMultiselect.push({
            key: p,
            label: p,
            value: p,
        })
    })

    console.log(projectsMultiselect)

    const [selectedProyecto, setSelectedProyecto] = useState([]);

    const arriendosReady = dataToExport.filter(p => p.type === "Débito REAL").map(buildArriendosRowForTemplate)
    const arriendosResumenReady = flt.filtered.map(buildArriendosResumenForTemplate)

    const onDownloadReport = (e) => {
        e.preventDefault()
        exportArriendosToXlsx({
            templatePath: "/plantillas/Formato_Matriz_Arriendos.xlsx",
            data: arriendosReady,
            data2: arriendosResumenReady,
            fileName: "Reporte Arriendos"
        })
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">
        
                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        class="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Arriendos</h2>
                </div>
                {/* Filtros */}
                <div className="col-span-12 lg:col-span-12 space-y-3 mb-6">
                    <Card className="">
                        <CardHeader>
                            <CardTitle className="text-base">Filtros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 grid gap-4 grid-cols-1 md:grid-cols-5">
                            {/* Año */}
                            <div>
                                <div className="mb-1 text-xs font-medium">Año</div>
                                <Select value={flt.anio} onValueChange={flt.setAnio}>
                                    <SelectTrigger className="h-8 w-full">
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {flt.options.anio.map((g) => (
                                            <SelectItem key={g} value={g}><span className="block truncate">{g}</span></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Proyecto */}
                            <div>
                                <div className="mb-1 text-xs font-medium">Proyecto</div>
                                <Select value={flt.proyecto} onValueChange={flt.setProyecto}>
                                    <SelectTrigger className="h-8 w-full">
                                        <SelectValue placeholder="Proyecto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todos">Todos</SelectItem>
                                        {flt.options.proyecto.map((g) => (
                                            <SelectItem key={g} value={g}><span className="block truncate">{g}</span></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* <MultiSelect
                                    options={projectsMultiselect}
                                    selected={flt.proyecto}
                                    onChange={flt.setProyecto}
                                    placeholder="Seleccionar proyectos"
                                /> */}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">
                                        {/* Tabs */}
                                        <Tabs defaultValue="summary" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="summary" className="gap-2">
                                                    <span>Resumen</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="details" className="gap-2">
                                                    <span>Detalles</span>
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="summary" className="mt-6">
                                                <ResumenOpex data={flt.filtered} />
                                            </TabsContent>
                                            <TabsContent value="details" className="mt-6">
                                                <DetallesOpex data={flt.filtered} />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>		
                </div>
            </div>
        </div>
    )
}