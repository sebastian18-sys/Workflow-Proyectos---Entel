import MultiSelectFilter from "@/components/ui/_multiselect3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForecasts } from "@/hooks/budget/planning/useForecasts";
import { formatCurrency, unique } from "@/lib/helpers";
import { buildForecastHierarchy2 } from "@/lib/transform-data-compliance";
import { ArrowLeft, Briefcase, ChevronDown, ChevronRightIcon, Columns2, DraftingCompass, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const isAll = (value) =>
    value === "Todos" ||
    value == null ||
    (Array.isArray(value) && value.length === 0);

const matchesFilter = (selected, currentValue) => {
    if (isAll(selected)) return true;
    if (Array.isArray(selected)) return selected.includes(currentValue);
    return selected === currentValue;
};

/** ===== Filtros anidados ===== */
function useFilters(data) {
    // const [gerencia, setGerencia] = useState(["GERENCIA DE CONSTRUCCION E INFRAESTRUCTURA DE RED"]);
    const [tipo, setTipo] = useState([]);
    // const [categoria, setCategoria] = useState("Todos");
    const [unidadFuncional, setUnidadFuncional] = useState([]);
    const [categoria, setCategoria] = useState([]);
    // const [fcst, setFcst] = useState("6+6");
    // const [mes, setMes] = useState("Julio");

    // Helper: Apply filters
    const apply = (omit) => (d) => {
        // const byGer = omit === "gerencia" || matchesFilter(gerencia, d.gerencia);
        const byAno = omit === "tipo" || matchesFilter(tipo, d.tipo);
        const byUFuncional = omit === "unidadFuncional" || matchesFilter(unidadFuncional, d.unidad_funcional);
        // const byAno = omit === "tipo" || tipo === "Todos" || d.tipo === tipo;
        // const byProy = omit === "proyecto" || proyecto === "Todos" || d.project_name === proyecto;
        const byCat = omit === "categoria" || matchesFilter(categoria, d.grupo);
        // const byCat = omit === "categoria" || categoria === "Todos" || (d.categoria ?? "") === categoria;
        return byAno && byUFuncional && byCat;
    };

    const options = {
        // gerencias: useMemo(() => unique(data.filter(apply("gerencia")).map(d => d.gerencia)), [data, unidadFuncional, tipo, categoria]),
        unidadFuncionales: useMemo(() => unique(data.filter(apply("unidadFuncional")).map(d => d.unidad_funcional)), [data, tipo, categoria]),
        tipos: useMemo(() => unique(data.filter(apply("tipo")).map(d => d.tipo)), [data, unidadFuncional, categoria]),
        categorias: useMemo(() => unique(data.filter(apply("categoria")).map(d => d.grupo)), [data, unidadFuncional, tipo]),
        // fcsts: ["Plan", "1+11","2+10","3+9", "4+8", "5+7","6+6", "7+5", "8+4","9+3", "10+2", "11+1"],
        // meses: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    };

    const filtered = useMemo(() => data.filter(apply("")), [data, unidadFuncional, tipo, categoria]);

    return { 
        options, 
        filtered,
        unidadFuncional, setUnidadFuncional,
        tipo, setTipo,
        categoria, setCategoria,
        // fcst, setFcst,
        // mes, setMes
    };
}

export default function SummaryFcst() {

    const { forecast, loading } = useForecasts({ page: 1, limit: 1000})

    const flt = useFilters(forecast);

    const ufsFcstData = useMemo(
        () => buildForecastHierarchy2(flt.filtered),
        [flt.filtered]
    );

	const { ufsFcst: mockNestedData, grandTotal } = ufsFcstData



    const [expandedUF, setExpandedUF] = useState(new Set(["pm1", "pm3"]))
        const [expandedProjects, setExpandedProjects] = useState(new Set(["proj1", "proj2"]))

    const toggleUF = (pmId) => {
		setExpandedUF((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(pmId)) {
				newSet.delete(pmId)
			} else {
				newSet.add(pmId)
			}
			return newSet
		})
	}

	const toggleProject = (projectId) => {
		setExpandedProjects((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(projectId)) {
				newSet.delete(projectId)
			} else {
				newSet.add(projectId)
			}
			return newSet
		})
	}

    console.log("groupedForecast", mockNestedData)

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* NAV TABS */}
                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    <Link aria-current="page" to="/budget/planning/forecasts/summary" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Layers /> Resumen
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/planning/forecasts/details" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Columns2 /> Detalles
                                        </div>
                                    </Link>
                                </div>
								<div className="">
									<Link to="/budget/planning/forecasts/draft" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
										<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
											<DraftingCompass /> Borrador
										</div>
									</Link>
								</div>
                            </div>  
                        </div>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Resumen</h2>
                </div>

                {/* Main */}
                <div>
                    <div className="relative">
                        {/* Filtros */}
						<div className="col-span-12 lg:col-span-12 space-y-3 mb-6">
							<Card className="shadow-sm">
								<CardHeader>
									<CardTitle className="text-base">Filtros</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 grid gap-4 grid-cols-1 md:grid-cols-5">
									{/* UF */}
									<div>
										<MultiSelectFilter
											label="Unidad Funcional"
											icon={Briefcase}
											options={flt.options.unidadFuncionales}
											selected={flt.unidadFuncional}
											onChange={flt.setUnidadFuncional}
											placeholder="Seleccionar"	
										/>
									</div>
									{/* Categoría */}
									<div>
										<MultiSelectFilter
											label="Categoría"
											icon={Briefcase}
											options={flt.options.categorias}
											selected={flt.categoria}
											onChange={flt.setCategoria}
											placeholder="Seleccionar"	
										/>
									</div>
                                    {/* Tipo */}
									<div>
										<MultiSelectFilter
											label="Tipo"
											icon={Briefcase}
											options={flt.options.tipos}
											selected={flt.tipo}
											onChange={flt.setTipo}
											placeholder="Seleccionar"	
										/>
									</div>
									{/* FCST */}
									{/* <div>
										<div className="mb-1 text-xs font-medium">FCST</div>
										<Select value={flt.fcst} onValueChange={flt.setFcst}>
											<SelectTrigger className="h-8 w-full">
												<SelectValue placeholder="FCST" />
											</SelectTrigger>
											<SelectContent>
												{flt.options.fcsts.map((c) => (
													<SelectItem key={c} value={c}><span className="block truncate">{c}</span></SelectItem>
												))}
											</SelectContent>
										</Select>
									</div> */}
									{/* Mes */}
									{/* <div>
										<div className="mb-1 text-xs font-medium">Mes</div>
										<Select value={flt.mes} onValueChange={flt.setMes}>
											<SelectTrigger className="h-8 w-full">
												<SelectValue placeholder="FCST" />
											</SelectTrigger>
											<SelectContent>
												{flt.options.meses.map((c) => (
													<SelectItem key={c} value={c}><span className="block truncate">{c}</span></SelectItem>
												))}
											</SelectContent>
										</Select>
									</div> */}
									
								</CardContent>
							</Card>
						</div>

                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        {/* Nested Table */}
										<div className="overflow-x-auto">
											<Table className="sticky top-0 z-20 backdrop-blur border-b-2">
												<TableHeader className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
													<TableRow>
														<TableHead className="py-2 min-w-[300px] sm:min-w-[400px] uppercase text-white bg-[#0000FF]">Unidad Funcional</TableHead>
														{/* <TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">FCST 5+7</TableHead> */}
														{/* <TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">CF 5+7</TableHead> */}
														{/* <TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">FCST 6+6</TableHead> */}
														{/* <TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">CF 6+6</TableHead> */}
														<TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">FCST TOTAL 6+6</TableHead>
														<TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">FCST TOTAL 7+5</TableHead>
														<TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">DIFERENCIA</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{mockNestedData.map((uf) => (
													<>
														{/* Trimestre Level */}
														<TableRow key={uf.id} className="bg-muted/30 font-medium hover:bg-muted/50">
															<TableCell className="py-2">
																<button
																	onClick={() => toggleUF(uf.id)}
																	className="flex items-center gap-2 hover:text-primary transition-colors"
																>
																	{expandedUF.has(uf.id) ? (
																		<ChevronDown className="h-4 w-4 shrink-0" />
																	) : (
																		<ChevronRightIcon className="h-4 w-4 shrink-0" />
																	)}
																	<span>{uf.nombre}</span>
																</button>
															</TableCell>
															<TableCell className="py-2 text-right">{formatCurrency(uf.total_old)}</TableCell>
															<TableCell className="py-2 text-right">{formatCurrency(uf.total_new)}</TableCell>
															<TableCell className="py-2 text-right">{formatCurrency(uf.dif_total_fcst)}</TableCell>
															{/* <TableCell className="py-2 text-right">{formatCurrency(uf.total_old_fcst)}</TableCell> */}
															{/* <TableCell className="py-2 text-right">{formatCurrency(uf.total_old_cf)}</TableCell> */}
															{/* <TableCell className="py-2 text-right">{formatCurrency(uf.total_fcst)}</TableCell> */}
															{/* <TableCell className="py-2 text-right">{formatCurrency(uf.total_cf)}</TableCell> */}
														</TableRow>

														{/* Projects Level */}
														{expandedUF.has(uf.id) &&
														uf.projects.map((p) => (
															<>
															<TableRow key={p.id} className="bg-muted/15 hover:bg-muted/25">
																<TableCell className="py-2">
																	<button
																		onClick={() => toggleProject(p.id)}
																		className="flex items-center gap-2 pl-8 hover:text-primary transition-colors"
																	>
																		{expandedProjects.has(p.id) ? (
																			<ChevronDown className="h-4 w-4 shrink-0" />
																		) : (
																			<ChevronRightIcon className="h-4 w-4 shrink-0" />
																		)}
																		<span className="text-sm">{p.nombre}</span>
																	</button>
																</TableCell>
																<TableCell className="py-2 text-right">{formatCurrency(p.total_old)}</TableCell>
																<TableCell className="py-2 text-right">{formatCurrency(p.total_new)}</TableCell>
																<TableCell className="py-2 text-right">{formatCurrency(p.dif_total_fcst)}</TableCell>
																{/* <TableCell className="py-2 text-right">{formatCurrency(p.total_old_fcst)}</TableCell> */}
																{/* <TableCell className="py-2 text-right">{formatCurrency(p.total_old_cf)}</TableCell> */}
																{/* <TableCell className="py-2 text-right">{formatCurrency(p.total_fcst)}</TableCell> */}
																{/* <TableCell className="py-2 text-right">{formatCurrency(p.total_cf)}</TableCell> */}
															</TableRow>

                                                            {/* Linea Inversion Level */}
                                                            {expandedProjects.has(p.id) &&
                                                                p.lines.map((line) => (
                                                                <TableRow key={line.id} className="hover:bg-muted/10">
                                                                    <TableCell className="py-2 pl-32">
                                                                        <span className="text-sm text-muted-foreground">{line.nombre}</span>
                                                                    </TableCell>
																	<TableCell className="py-2 text-right">{formatCurrency(line.total_old)}</TableCell>
																	<TableCell className="py-2 text-right">{formatCurrency(line.total_new)}</TableCell>
																	<TableCell className="py-2 text-right">{formatCurrency(line.dif_total_fcst)}</TableCell>
																	{/* <TableCell className="py-2 text-right">{formatCurrency(line.total_old_fcst)}</TableCell> */}
																	{/* <TableCell className="py-2 text-right">{formatCurrency(line.total_old_cf)}</TableCell> */}
                                                                    {/* <TableCell className="py-2 text-right">{formatCurrency(line.total_fcst)}</TableCell> */}
                                                                    {/* <TableCell className="py-2 text-right">{formatCurrency(line.total_cf)}</TableCell> */}
                                                                    
                                                                </TableRow>
                                                            ))}
															</>
														))}
													</>
													))}

													<TableRow className="sticky bottom-0 z-30 border-t-2 bg-white border-slate-200">
														<TableCell className="py-2 min-w-[300px] sm:min-w-[400px] uppercase text-white bg-[#0000FF]">TOTAL</TableCell>
														{/* <TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">{formatCurrency(grandTotal.total_old_fcst)}</TableCell>
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">{formatCurrency(grandTotal.total_old_cf)}</TableCell>
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">
															{formatCurrency(grandTotal.total_fcst)}
														</TableCell>
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">
															{formatCurrency(grandTotal.total_cf)}
														</TableCell> */}
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">{formatCurrency(grandTotal.total_old)}</TableCell>
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">{formatCurrency(grandTotal.total_new)}</TableCell>
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#747474]">{formatCurrency(grandTotal.dif_total_fcst)}</TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>

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