import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Briefcase, ChevronDown, ChevronRightIcon, Columns2, Layers } from "lucide-react";
import { buildNestedData } from "@/lib/transform-data-compliance";
import useTableTool from "@/hooks/useTableTool";
import Pagination from "@/components/Tables/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectsCapex } from "@/hooks/budget/capex/useProjectsCapex";
import { formatCurrency, formatCurrencyWithoutDecimals, unique } from "@/lib/helpers";
import MultiSelectFilter from "@/components/ui/_multiselect3";
import { Link, useOutletContext } from "react-router";
import SelectFilter from "@/components/ui/_select3";

const columns = [
	{ id: "jefatura", label: "Jefatura", visible: true },
	{ id: "proyecto", label: "Proyecto", visible: true },
	{ id: "linea", label: "Línea de Inversión", visible: true },
	{ id: "solpe", label: "SOLPE", visible: true },
	{ id: "fcst_mes", label: "FCST a", visible: true },
	{ id: "comprometido", label: "Comprometido", visible: true },
	{ id: "actas", label: "Actas", visible: true },
	{ id: "pend_fcst_mes", label: "Pend. FCST a", visible: true },
	{ id: "fcst_pct_mes", label: "% cumplimiento a", visible: true },
]

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
	const [gerencia, setGerencia] = useState(["GERENCIA DE CONSTRUCCION E INFRAESTRUCTURA DE RED"]);
	const [tipo, setTipo] = useState(["Proy."]);
	// const [categoria, setCategoria] = useState("Todos");
	const [tipoTrimestre, setTipoTrimestre] = useState('Q Real');
	const [unidadFuncional, setUnidadFuncional] = useState([]);
	const [categoria, setCategoria] = useState([]);
	const [fcst, setFcst] = useState("7+5");
	const [mes, setMes] = useState("Octubre");

	// Helper: Apply filters
	const apply = (omit) => (d) => {
		const byGer = omit === "gerencia" || matchesFilter(gerencia, d.gerencia);
		const byAno = omit === "tipo" || matchesFilter(tipo, d.tipo);
		const byTrimestre = omit === "tipoTrimestre" || matchesFilter(tipoTrimestre, d.trimestre_real);
		const byUFuncional = omit === "unidadFuncional" || matchesFilter(unidadFuncional, d.unidad_funcional);
		// const byAno = omit === "tipo" || tipo === "Todos" || d.tipo === tipo;
		// const byProy = omit === "proyecto" || proyecto === "Todos" || d.project_name === proyecto;
		const byCat = omit === "categoria" || matchesFilter(categoria, d.categoria);
		// const byCat = omit === "categoria" || categoria === "Todos" || (d.categoria ?? "") === categoria;
		return byGer && byAno && byUFuncional && byCat;
	};

	const options = {
		gerencias: useMemo(() => unique(data.filter(apply("gerencia")).map(d => d.gerencia)), [data, unidadFuncional, tipo, categoria]),
		unidadFuncionales: useMemo(() => unique(data.filter(apply("unidadFuncional")).map(d => d.unidad_funcional)), [data, gerencia, tipo, categoria]),
		tipos: ["Todos", "CARRYOVER", "Proy."],
		tiposTrimestre: ["Q Planificado", "Q Real"],
		categorias: useMemo(() => unique(data.filter(apply("categoria")).map(d => d.categoria)), [data, unidadFuncional, gerencia, tipo]),
		fcsts: ["Plan", "1+11","2+10","3+9", "4+8", "5+7","6+6", "7+5", "8+4","9+3", "10+2", "11+1"],
		meses: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
	};

	const filtered = useMemo(() => data.filter(apply("")), [data, unidadFuncional, gerencia, tipo, categoria]);

	return { 
		options, 
		filtered,
		gerencia, setGerencia,
		unidadFuncional, setUnidadFuncional,
		tipo, setTipo,
		tipoTrimestre, setTipoTrimestre,
		categoria, setCategoria,
		fcst, setFcst,
		mes, setMes
	};
}

export default function ComplianceLeadership() {

	const { isCollapsed = false } = useOutletContext() || {}

    const {
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        sortDirection,
        setSortDirection,
        itemsPerPage,
        setItemsPerPage,
        visibleColumns,
        toggleColumn,
    } = useTableTool({ columns })
   
	const [expandedTrimestres, setExpandedTrimestres] = useState(new Set(["tri1", "tri2"]))
    const [expandedUF, setExpandedUF] = useState(new Set(["pm1", "pm3"]))
	const [expandedProjects, setExpandedProjects] = useState(new Set(["proj1", "proj2"]))
	

    let { projects } = useProjectsCapex()
	projects = projects.filter(p => p.capex_opex === "CAPEX")

    const flt = useFilters(projects);

	const targetMonth = flt.mes;
	const fcstKey = flt.fcst

	const triData = useMemo(
		() => buildNestedData(flt.filtered, { targetMonth, fcstKey }, flt.tipoTrimestre),
		[flt.filtered, targetMonth, fcstKey, flt.tipoTrimestre]
	);

	const { trimestres: mockNestedData, grandTotal } = triData

    const totalResults = mockNestedData.length ?? 0
	const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

	const toggleTrimestre = (trimestreId) => {
		setExpandedTrimestres((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(trimestreId)) {
				newSet.delete(trimestreId)
			} else {
				newSet.add(trimestreId)
			}
			return newSet
		})
	}

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

    return (
        <div className="flex flex-col px-4 mt-14 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
			<div className="flex min-h-full w-full min-w-0 flex-col">

				{/* NAV TABS */}
				<div className={`fixed top-18 right-0 left-0 z-10 -mt-px flex h-14 flex-col items-center border-b bg-white px-4 md:px-6 lg:px-8 2xl:top-20 xl:px-10 2xl:px-14
                    ${
                        isCollapsed
                            ? "xl:left-16 2xl:left-16"
                            : "xl:left-60 2xl:left-72"
                    }`}
                >
					<div className="flex min-h-full w-full flex-col">
						<div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
							<div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
								<div className="">
									<Link aria-current="page" to="/budget/capex/leadership" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
										<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
											<Layers /> Indicadores
										</div>
									</Link>
								</div>
								<div className="">
									<Link to="/budget/capex/compliance-uf" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
										<div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
											<Columns2 /> Cumplimento UF
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
						class="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
					>
						<ArrowLeft className="h-5 w-5" />
					</a>
					<h2 className="text-2xl font-semibold text-[#2b7fff]">Indicadores</h2>
				</div>

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
									<div>
										<SelectFilter
											label="Trimestre"
											icon={Briefcase}
											options={flt.options.tiposTrimestre}
											value={flt.tipoTrimestre}
											onChange={flt.setTipoTrimestre}
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
												<TableHeader className="h-6 bg-slate-50/90  hover:bg-slate-50/90">
													<TableRow>
														<TableHead className="py-2 min-w-[200px] sm:min-w-[300px] uppercase text-white bg-[#0000FF]">Unidad Funcional</TableHead>
														<TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">FCST Total</TableHead>
														<TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">Habilitado</TableHead>
														<TableHead className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">Comprometido</TableHead>
														<TableHead className="py-2 text-center min-w-[130px] uppercase text-white bg-[#747474]">%Cpmt</TableHead>
														<TableHead className="py-2 text-center min-w-[110px] uppercase text-white bg-[#0000FF]">Acta</TableHead>
														<TableHead className="py-2 text-center min-w-[130px] uppercase text-white bg-[#747474]">%Pago</TableHead>
														{/* <TableHead className="py-2 text-center min-w-[110px] uppercase text-white bg-[#0000FF]">%Avance Proy</TableHead> */}
														{/* <TableHead className="text-right min-w-[130px] uppercase text-amber-700 bg-amber-50/60">Pendiente Lib</TableHead> */}
													</TableRow>
												</TableHeader>
												<TableBody>
													{mockNestedData.map((tri) => (
													<>
														{/* Trimestre Level */}
														<TableRow key={tri.id} className="bg-muted/30 font-medium hover:bg-muted/50">
															<TableCell className="py-2">
																<button
																	onClick={() => toggleTrimestre(tri.id)}
																	className="flex items-center gap-2 hover:text-primary transition-colors"
																>
																	{expandedTrimestres.has(tri.id) ? (
																		<ChevronDown className="h-4 w-4 shrink-0" />
																	) : (
																		<ChevronRightIcon className="h-4 w-4 shrink-0" />
																	)}
																	<span>{tri.nombre}</span>
																</button>
															</TableCell>
															<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(tri.fcstTotal)}</TableCell>
															<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(tri.solpe)}</TableCell>
															<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(tri.comprometido)}</TableCell>
															<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(tri.porcentajeComprometido)}%</TableCell>
															<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(tri.actas)}</TableCell>
															<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(tri.porcentajeActas)}%</TableCell>
															{/* <TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(tri.porcentajeAvanceProy)}%</TableCell> */}
															{/* <TableCell className="text-right">{formatCurrency(tri.pendLiberar)}</TableCell> */}
														</TableRow>

														{/* Projects Level */}
														{expandedTrimestres.has(tri.id) &&
														tri.unidadesFuncionales.map((uf) => (
															<>
															<TableRow key={uf.id} className="bg-muted/15 hover:bg-muted/25">
																<TableCell className="py-2">
																	<button
																		onClick={() => toggleUF(uf.id)}
																		className="flex items-center gap-2 pl-8 hover:text-primary transition-colors"
																	>
																		{expandedUF.has(uf.id) ? (
																			<ChevronDown className="h-4 w-4 shrink-0" />
																		) : (
																			<ChevronRightIcon className="h-4 w-4 shrink-0" />
																		)}
																		<span className="text-sm">{uf.nombre}</span>
																	</button>
																</TableCell>
																<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(uf.fcstTotal)}</TableCell>
																<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(uf.solpe)}</TableCell>
																<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(uf.comprometido)}</TableCell>
																<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(uf.porcentajeComprometido)}%</TableCell>
																<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(uf.actas)}</TableCell>
																<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(uf.porcentajeActas)}%</TableCell>
																{/* <TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(uf.porcentajeAvanceProy)}%</TableCell> */}
																{/* <TableCell className="text-right">{formatCurrency(uf.pendLiberar)}</TableCell> */}
															</TableRow>

															{/* Linea Inversion Level */}
															{expandedUF.has(uf.id) &&
																uf.projects.map((projects) => (
																<>
																<TableRow key={projects.id} className="hover:bg-muted/10">
																	<TableCell className="py-2 pl-16">
																		<button
																			onClick={() => toggleProject(projects.id)}
																			className="flex items-center gap-2 pl-8 hover:text-primary transition-colors"
																		>
																			{expandedProjects.has(projects.id) ? (
																				<ChevronDown className="h-4 w-4 shrink-0" />
																			) : (
																				<ChevronRightIcon className="h-4 w-4 shrink-0" />
																			)}
																			<span className="text-sm">{projects.nombre}</span>
																		</button>
																	</TableCell>
																	<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(projects.fcstTotal)}</TableCell>
																	<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(projects.solpe)}</TableCell>
																	<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(projects.comprometido)}</TableCell>
																	<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(projects.porcentajeComprometido)}%</TableCell>
																	<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(projects.actas)}</TableCell>
																	<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(projects.porcentajeActas)}%</TableCell>
																	{/* <TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(projects.porcentajeAvanceProy)}%</TableCell> */}
																	{/* <TableCell className="text-right">{formatCurrency(projects.pendLiberar)}</TableCell> */}
																</TableRow>

																{/* Linea Inversion Level */}
																{expandedProjects.has(projects.id) &&
																	projects.lines.map((line) => (
																	<TableRow key={line.id} className="hover:bg-muted/10">
																		<TableCell className="py-2 pl-32">
																			<span className="text-sm text-muted-foreground">{line.nombre}</span>
																		</TableCell>
																		<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(line.fcstTotal)}</TableCell>
																		<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(line.solpe)}</TableCell>
																		<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(line.comprometido)}</TableCell>
																		<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(line.porcentajeComprometido)}%</TableCell>
																		<TableCell className="py-2 text-right">{formatCurrencyWithoutDecimals(line.actas)}</TableCell>
																		<TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(line.porcentajeActas)}%</TableCell>
																		{/* <TableCell className="py-2 text-center font-normal text-slate-800 bg-slate-100">{formatCurrencyWithoutDecimals(line.porcentajeAvanceProy)}%</TableCell> */}
																		{/* <TableCell className="text-right">{formatCurrency(line.pendLiberar)}</TableCell> */}
																	</TableRow>
																	))}
																</>

																))}
															</>
														))}
													</>
													))}
													<TableRow className="sticky bottom-0 z-30 border-t-2 bg-white border-slate-200">
                                                        <TableCell className="py-2 min-w-[300px] sm:min-w-[400px] uppercase text-white bg-[#0000FF]">TOTAL</TableCell>
                                                        <TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.fcstTotal)}
                                                        </TableCell>
														<TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.solpe)}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.comprometido)}
                                                        </TableCell>
                                                        
                                                        <TableCell className="py-2 text-center min-w-[130px] uppercase text-white bg-[#747474]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.porcentajeComprometido)}%
                                                        </TableCell>
                                                        <TableCell className="py-2 text-right min-w-[130px] uppercase text-white bg-[#0000FF]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.actas)}
                                                        </TableCell>
                                                        <TableCell className="py-2 text-center min-w-[130px] uppercase text-white bg-[#747474]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.porcentajeActas)}%
                                                        </TableCell>
														{/* <TableCell className="py-2 text-center min-w-[110px] uppercase text-white bg-[#0000FF]">
                                                            {formatCurrencyWithoutDecimals(grandTotal.porcentajeAvanceProy)}%
														</TableCell> */}
                                                    </TableRow>
												</TableBody>
											</Table>
										</div>
										{/* PAGINATION */}
										<Pagination
											totalResults={totalResults} 
											totalPages={totalPages} 
											currentPage={currentPage} 
											setCurrentPage={setCurrentPage} 
										/>
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