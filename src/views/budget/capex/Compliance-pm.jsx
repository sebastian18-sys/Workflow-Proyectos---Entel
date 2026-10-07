import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRightIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildNestedData } from "@/lib/transform-data-pm";
import useTableTool from "@/hooks/useTableTool";
import Pagination from "@/components/Tables/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectsCapex } from "@/hooks/budget/capex/useProjectsCapex";
import { formatCurrency, unique } from "@/lib/helpers";

const columns = [
	{ id: "pm", label: "PM", visible: true },
	{ id: "proyecto", label: "Proyecto", visible: true },
	{ id: "linea", label: "Línea de Inversión", visible: true },
	{ id: "solpe", label: "SOLPE", visible: true },
	{ id: "fcstAgosto", label: "FCST a Agosto", visible: true },
	{ id: "comprometido", label: "Comprometido", visible: true },
	{ id: "actas", label: "Actas", visible: true },
	{ id: "pendAgosto", label: "Pend. a Agosto", visible: true },
	{ id: "porcentajePend", label: "% Pend. a Agosto", visible: true },
]

/** ===== Filtros anidados ===== */
function useFilters(data) {
	const [gerencia, setGerencia] = useState("GERENCIA DE CONSTRUCCION E INFRAESTRUCTURA DE RED");
	const [tipo, setTipo] = useState("Proy.");
	const [categoria, setCategoria] = useState("Todos");
	const [fcst, setFcst] = useState("7+5");
	const [mes, setMes] = useState("Agosto");

	// Helper: Apply filters
	const apply = (omit) => (d) => {
		const byGer = omit === "gerencia" || gerencia === "Todos" || d.gerencia === gerencia;
		const byAno = omit === "tipo" || tipo === "Todos" || d.tipo === tipo;
		const byCat = omit === "categoria" || categoria === "Todos" || (d.categoria ?? "") === categoria;
		return byGer && byAno && byCat;
	};

	const options = {
		gerencias: useMemo(() => unique(data.filter(apply("gerencia")).map(d => d.gerencia)), [data, tipo, categoria]),
		tipos: ["Todos", "CARRYOVER", "Proy."],
		categorias: useMemo(() => unique(data.filter(apply("categoria")).map(d => d.categoria)), [data, gerencia, tipo]),
		fcsts: ["Plan", "1+11","2+10","3+9", "4+8", "5+7","6+6", "7+5", "8+4","9+3", "10+2", "11+1"],
		meses: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
	};

	const filtered = useMemo(() => data.filter(apply("")), [data, gerencia, tipo, categoria]);

	return { 
		options, 
		filtered,
		gerencia, setGerencia,
		tipo, setTipo,
		categoria, setCategoria,
		fcst, setFcst,
		mes, setMes
	};
}

export default function CompliancePM() {

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

	let { projects } = useProjectsCapex()
	projects = projects.filter(p => p.capex_opex === "CAPEX")
	const flt = useFilters(projects);
	const targetMonth = flt.mes;
	const fcstKey = flt.fcst

	const mockNestedData = useMemo(
		() => buildNestedData(flt.filtered, { targetMonth, fcstKey }),
		[flt.filtered, targetMonth, fcstKey]
	);

	const totalResults = mockNestedData.length
	const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

	// Estado para controlar qué elementos están expandidos
	const [expandedPMs, setExpandedPMs] = useState(new Set(["pm1", "pm3"]))
	const [expandedProjects, setExpandedProjects] = useState(new Set(["proj1", "proj2"]))

	const togglePM = (pmId) => {
		setExpandedPMs((prev) => {
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
				{/* Breadcrumb */}
				<div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
					<a 
						href="#" 
						title="Atrás" 
						class="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
					>
						<ArrowLeft className="h-5 w-5" />
					</a>
					<h2 className="text-2xl font-semibold text-[#2b7fff]">Cumplimiento PM</h2>
				</div>

				<div>
                    <div className="relative">

						{/* Filtros */}
						<div className="col-span-12 lg:col-span-12 space-y-3 mb-6">
							<Card className="">
								<CardHeader>
									<CardTitle className="text-base">Filtros</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3 grid gap-4 grid-cols-1 md:grid-cols-5">
									{/* Gerencia */}
									<div>
										<div className="mb-1 text-xs font-medium">Gerencia</div>
										<Select value={flt.gerencia} onValueChange={flt.setGerencia}>
											<SelectTrigger className="h-8 w-full">
												<SelectValue placeholder="Gerencia" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Todos">Todos</SelectItem>
												{flt.options.gerencias.map((g) => (
													<SelectItem key={g} value={g}><span className="block truncate">{g}</span></SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{/* Tipo */}
									<div>
										<div className="mb-1 text-xs font-medium">Tipo</div>
										<Select value={flt.tipo} onValueChange={flt.setTipo}>
											<SelectTrigger className="h-8 w-full">
												<SelectValue placeholder="Tipo" />
											</SelectTrigger>
											<SelectContent>
												{flt.options.tipos.map((y) => (
													<SelectItem key={y} value={y}>{y}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{/* Categoría */}
									<div>
										<div className="mb-1 text-xs font-medium">Categoría</div>
										<Select value={flt.categoria} onValueChange={flt.setCategoria}>
											<SelectTrigger className="h-8 w-full">
												<SelectValue placeholder="Categoría" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Todos">Todos</SelectItem>
												{flt.options.categorias.map((c) => (
													<SelectItem key={c} value={c}><span className="block truncate">{c}</span></SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{/* FCST */}
									<div>
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
									</div>
									{/* Mes */}
									<div>
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
									</div>
									
								</CardContent>
							</Card>
						</div>	

                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">
										{/* Nested Table */}
										<div className="overflow-x-auto border-t-1">
											<Table>
												<TableHeader className="sticky top-0 z-20 backdrop-blur border-b-2">
													<TableRow className="h-8 bg-slate-50/90  hover:bg-slate-50/90">
														<TableHead className="min-w-[300px] sm:min-w-[400px] uppercase text-[#64748B]">PM / Proyecto / Línea</TableHead>
														<TableHead className="text-right min-w-[130px] uppercase text-[#64748B]">SOLPE</TableHead>
														<TableHead className="text-right min-w-[130px] uppercase text-[#64748B]">FCST a {targetMonth}</TableHead>
														<TableHead className="text-right min-w-[130px] uppercase text-[#64748B]">Comprometido</TableHead>
														<TableHead className="text-right min-w-[110px] uppercase text-[#64748B]">Actas</TableHead>
														<TableHead className="text-right min-w-[150px] uppercase text-[#64748B]">Pend. Meta a {targetMonth}</TableHead>
														<TableHead className="text-right min-w-[160px] uppercase text-[#64748B]">% Pend. Meta a {targetMonth}</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{mockNestedData.map((pm) => (
													<>
														{/* PM Level */}
														<TableRow key={pm.id} className="bg-muted/30 font-medium hover:bg-muted/50">
															<TableCell>
																<button
																onClick={() => togglePM(pm.id)}
																className="flex items-center gap-2 hover:text-primary transition-colors"
																>
																{expandedPMs.has(pm.id) ? (
																	<ChevronDown className="h-4 w-4 shrink-0" />
																) : (
																	<ChevronRightIcon className="h-4 w-4 shrink-0" />
																)}
																<span>{pm.nombre}</span>
																</button>
															</TableCell>
															<TableCell className="text-right">{formatCurrency(pm.solpe)}</TableCell>
															<TableCell className="text-right">{formatCurrency(pm.fcstAgosto)}</TableCell>
															<TableCell className="text-right">{formatCurrency(pm.comprometido)}</TableCell>
															<TableCell className="text-right">{formatCurrency(pm.actas)}</TableCell>
															<TableCell className="text-right">
																<span className={pm.pendMetaAgosto > 0 ? "text-red-600" : "text-emerald-600"}>
																	{formatCurrency(pm.pendMetaAgosto)}
																</span>
															</TableCell>
															<TableCell className="text-right">
																<span className={pm.porcentajePend > 0 ? "text-red-600" : "text-emerald-600"}>
																	{pm.porcentajePend} %
																</span>
															</TableCell>
														</TableRow>

														{/* Projects Level */}
														{expandedPMs.has(pm.id) &&
														pm.projects.map((project) => (
															<>
															<TableRow key={project.id} className="bg-muted/15 hover:bg-muted/25">
																<TableCell>
																<button
																	onClick={() => toggleProject(project.id)}
																	className="flex items-center gap-2 pl-8 hover:text-primary transition-colors"
																>
																	{expandedProjects.has(project.id) ? (
																	<ChevronDown className="h-4 w-4 shrink-0" />
																	) : (
																	<ChevronRightIcon className="h-4 w-4 shrink-0" />
																	)}
																	<span className="text-sm">{project.nombre}</span>
																</button>
																</TableCell>
																<TableCell className="text-right">{formatCurrency(project.solpe)}</TableCell>
																<TableCell className="text-right">{formatCurrency(project.fcstAgosto)}</TableCell>
																<TableCell className="text-right">{formatCurrency(project.comprometido)}</TableCell>
																<TableCell className="text-right">{formatCurrency(project.actas)}</TableCell>
																<TableCell className="text-right">
																	<span className={project.pendMetaAgosto > 0 ? "text-red-600" : "text-emerald-600"}>
																		{formatCurrency(project.pendMetaAgosto)}
																	</span> 
																</TableCell>
																<TableCell className="text-right">
																	<span className={project.porcentajePend > 0 ? "text-red-600" : "text-emerald-600"}>
																		{project.porcentajePend} %
																	</span>
																</TableCell>
															</TableRow>

															{/* Investment Lines Level */}
															{expandedProjects.has(project.id) &&
																project.lines.map((line) => (
																<TableRow key={line.id} className="hover:bg-muted/10">
																	<TableCell className="pl-16">
																	<span className="text-sm text-muted-foreground">{line.nombre}</span>
																	</TableCell>
																	<TableCell className="text-right">{formatCurrency(line.solpe)}</TableCell>
																	<TableCell className="text-right">{formatCurrency(line.fcstAgosto)}</TableCell>
																	<TableCell className="text-right">{formatCurrency(line.comprometido)}</TableCell>
																	<TableCell className="text-right">{formatCurrency(line.actas)}</TableCell>
																	<TableCell className="text-right">
																		<span className={line.pendMetaAgosto > 0 ? "text-red-600" : "text-emerald-600"}>
																			{formatCurrency(line.pendMetaAgosto)}
																		</span>
																	</TableCell>
																	<TableCell className="text-right">
																		<span className={line.porcentajePend > 0 ? "text-red-600" : "text-emerald-600"}>
																			{line.porcentajePend} %
																		</span>
																	</TableCell>
																</TableRow>
																))}
															</>
														))}
													</>
													))}
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