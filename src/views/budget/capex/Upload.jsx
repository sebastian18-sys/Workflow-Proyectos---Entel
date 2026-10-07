import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, FileDown, ChevronDown, ChevronUp } from "lucide-react";
import { useUploadData } from "@/hooks/budget/capex/useUploadData";

const LS_PREFIX = "uploader_v1";
const comboKey = (code, year) => `${String(code).toLowerCase()}:${year ?? ""}`
const lsKey = (doc, year) => `${LS_PREFIX}:${doc}${year ? ":"+year : ""}`;

// ===== Seeds opcionales (code:year -> url/filename) =====
const PRELOADS = {
	"rq:2022": { url: "/app/TS 03.10 Historico de RQs - Nuevas Columnas v2_Reporte Excel 1.0 (2022).xlsx", filename: "TS 03.10 Historico de RQs - Nuevas Columnas v2_Reporte Excel 1.0 (2022).xlsx" },
	"rq:2023": { url: "/app/TS 03.10 Historico de RQs - Nuevas Columnas v2_Reporte Excel 1.0 (2023).xlsx", filename: "TS 03.10 Historico de RQs - Nuevas Columnas v2_Reporte Excel 1.0 (2023).xlsx" },
	"oc:2022": { url: "/app/TS 03.15 Orden de Compra_Reporte Excel 1.0 (2022).xlsx", filename: "TS 03.15 Orden de Compra_Reporte Excel 1.0 (2022).xlsx" },
	"oc:2023": { url: "/app/TS 03.15 Orden de Compra_Reporte Excel 1.0 (2023).xlsx", filename: "TS 03.15 Orden de Compra_Reporte Excel 1.0 (2023).xlsx" },
	"ac:2022": { url: "/app/TS 03.16 Códigos Recepción - Nuevas Columnas_Reporte (2022).xlsx", filename: "TS 03.16 Códigos Recepción - Nuevas Columnas_Reporte (2022).xlsx" },
	"ac:2023": { url: "/app/TS 03.16 Códigos Recepción - Nuevas Columnas_Reporte (2023).xlsx", filename: "TS 03.16 Códigos Recepción - Nuevas Columnas_Reporte (2023).xlsx" }
};

function getSeedInfo(code, year) {
	const key = `${String(code).toLowerCase()}:${year ?? ""}`
	return PRELOADS[key] ?? null;
}

function saveFileMeta(doc, file, year) {
	if (!file) return localStorage.removeItem(lsKey(doc, year));
	const meta = { name: file.name, size: file.size, type: file.type, ts: Date.now() };
	localStorage.setItem(lsKey(doc, year), JSON.stringify(meta));
}

function readFileMeta(doc, year) {
  	try { 

		const v = localStorage.getItem(lsKey(doc, year));
		if (!v) return null; 

		const m = JSON.parse(v); 
		return { name: m.name, ts: m.ts }; 

	} catch { 
		return null; 
	}
}

const FileDropzone = ({ value, placeholder = "Click o arrastra para subir", onChange }) => {
	const inputRef = useRef(null);
	const [hover, setHover] = useState(false);
	const onDrop = (e) => { 
		e.preventDefault(); 
		const f = e.dataTransfer.files?.[0]; 
		if (f) onChange(f); 
		setHover(false); 
	};
	return (
		<div
			onDragOver={(e)=>{e.preventDefault(); setHover(true);}}
			onDragLeave={(e)=>{e.preventDefault(); setHover(false);}}
			onDrop={onDrop}
			onClick={()=>inputRef.current?.click()}
			className={["flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition",
				hover ? "border-[#2b7fff] bg-[#2b7fff]/5" : "border-gray-300 hover:bg-gray-50",
			].join(" ")}
		>
			<UploadCloud className="h-7 w-7" />
			<div className="text-sm text-gray-700">{placeholder}</div>
			{value && <div className="text-xs text-gray-500">{value.name}</div>}
			<input ref={inputRef} type="file" className="hidden" onChange={(e)=> onChange(e.target.files?.[0] ?? null)} />
		</div>
	);
};

const RequiredCard = ({ title, code, years, currentYear, state, setState, templateHref }) => {

	const [yearIdx, setYearIdx] = useState(years.indexOf(currentYear) >= 0 ? years.indexOf(currentYear) : years.length - 1);
	const year = years[yearIdx];
	const key = comboKey(code, year);
	const seedGuardRef = useRef({});
	const file = state[key] ?? null;
	const prevMeta = readFileMeta(code, year);

	useEffect(() => {

		if (file || prevMeta) return;
		const seed = getSeedInfo(code, year);
		if (!seed || seedGuardRef.current[key]) return;

		(async () => {
			try {
				const res = await fetch(seed.url);
				if (!res.ok) return;
				const blob = await res.blob();
				const seededFile = new File([blob], seed.filename, {
					type: blob.type || "application/octet-stream",
				});

				setState(prev => ({ ...prev, [key]: seededFile }));
				saveFileMeta(code, seededFile, year);   // persiste nombre/fecha para mostrar “Cargado: …”
				seedGuardRef.current[key] = true;
			} catch (err) {
				console.error("No se pudo precargar seed", err);
			}
		})();
	}, [code, year, key, file, prevMeta, setState]);

	const onChange = (f) => {
		setState(prev => ({ ...prev, [key]: f }));
	};

	useEffect(()=>{ // persist meta whenever file changes
		saveFileMeta(code, file, year);
	}, [code, year, file]);

	return (
		<Card className="flex-1">
			<CardContent>
				<div className="mb-3 flex items-center justify-between">
					<div className="text-sm font-semibold">{title}</div>
					{/* Year tabs */}
					<div className="flex gap-2">
						{years.map((y, i)=>{
							const active = i === yearIdx;
							return (
								<button key={y} onClick={()=>setYearIdx(i)}
								className={["relative rounded-full px-3 py-1 text-xs font-medium",
									active?"bg-[#2b7fff] text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"].join(" ")}
								>
								{y}
								</button>
							);
							})}
					</div>
				</div>

				<FileDropzone value={file ?? undefined}
					placeholder={prevMeta ? `Cargado: ${prevMeta.name}` : "Click o arrastra para subir"}
					onChange={onChange}
				/>

				<div className="mt-3 flex items-center justify-between">
					<a href={templateHref} download className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
						<FileDown className="h-4 w-4" /> Descargar plantilla
					</a>
					{prevMeta && (
						<div className="text-xs text-gray-500">Último cargado: {new Date(prevMeta.ts).toLocaleString()}</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

const OPTIONAL_LABELS = {
	solpe: "SOLPE",
	cierre: "OC (Cierre de año)",
	fcst: "FCST (Subgerencia de Calidad y Gestión Financiera)",
	master_plan: "Master Plan (PMO-GCIR)",
	provision: "Provisiones"
};

const OptionalBlock = ({ state, setState }) => {
	const [open, setOpen] = useState(false);

	return (
		<Card>
			<CardContent>
				<div className="mb-2 flex items-center justify-between">
				<div className="text-sm font-semibold">ARCHIVOS OPCIONALES:</div>
				<Button variant="outline" onClick={()=>setOpen(v=>!v)} className="gap-1">
					{open ? <>Ocultar <ChevronUp className="h-4 w-4"/></> : <>Mostrar <ChevronDown className="h-4 w-4"/></>}
				</Button>
				</div>

				{open && (
				<div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{(Object.keys(OPTIONAL_LABELS)).map((key)=>{
						const fkey = `${key}`;
						const file = state[fkey] ?? null;
						const meta = readFileMeta(key);
						return (
							<div key={key} className="space-y-2">
							<div className="text-xs font-medium text-gray-700">{OPTIONAL_LABELS[key]}</div>
								<FileDropzone value={file ?? undefined}
									placeholder={meta ? `Cargado: ${meta.name}` : "Click o arrastra para subir"}
									onChange={(f)=>{ setState(prev=>({ ...prev, [fkey]: f })); saveFileMeta(key, f); }}
								/>
							</div>
						);
					})}
				</div>
				)}
			</CardContent>
		</Card>
	);
};

export default function Upload() {

	const currentYear = new Date().getFullYear();
	const years = useMemo(()=>{ 
		const ys = []; 
		for(let y=2022; y<=currentYear; y++) ys.push(y); 
		return ys;
	}, [currentYear]);

	let rq_data = []
	let oc_data = []
	let ac_data = []

	const [files, setFiles] = useState({});
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(false);

	const { uploadData } = useUploadData()

	const onUploadAll = async () => {
		setLoading(true);
		try {

			const rq_file = Object.keys(files).filter(k => k.startsWith("rq"))
			const oc_file = Object.keys(files).filter(k => k.startsWith("oc"))
			const ac_file = Object.keys(files).filter(k => k.startsWith("ac"))

			if(rq_file.length > 0) {
				rq_file.forEach(f => {
					rq_data.push({ year: f.split(":")[1], field: f, skiprows: 7 })
				})
			}

			if(oc_file.length > 0) {
				oc_file.forEach(f => {
					oc_data.push({ year: f.split(":")[1], field: f, skiprows: 7 })
				})
			}

			if(ac_file.length > 0) {
				ac_file.forEach(f => {
					ac_data.push({ year: f.split(":")[1], field: f, skiprows: 7 })
				})
			}

			// New
			const manifest = {
				rq: rq_data,
				oc: oc_data,
				cr: ac_data,
				misc: [
					files.solpe && { role: "solpe", field: "solpe", skiprows: 2 },
					files.cierre && { role: "cierre", field: "cierre", skiprows: 7 },
					files.fcst && { role: "fcst", field: "fcst", skiprows: 0 },
					files.master_plan && { role: "master_plan", field: "master_plan", skiprows: 0 },
					files.provision && { role: "provision", field: "provision", skiprows: 0 },
				].filter(Boolean)
			}

			const fd = new FormData();
			fd.append("manifest", JSON.stringify(manifest));

			Object.entries(files).forEach(([field, file]) => {
				if (file) fd.append(field, file)
			})

			try {
				const data = await uploadData(fd)
				if(data) {
					console.log("DATA", data)
				} else {
					console.log("ERROR")
				}
			} catch (error) {
				console.log(error)
			}

			alert("Documentos cargados correctamente");
		} catch (e) {
			console.error(e);
			alert("Error al cargar documentos");
		} finally {
			setLoading(false);
		}
	};

    return (
        <div className="flex flex-col px-4 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
			<h2 className="mb-4 text-2xl font-semibold text-[#2b7fff]">Carga de datos</h2>
			{/* 1) OBLIGATORIOS con años */}
			<div className="mb-6">
				<div className="mb-3 text-base font-semibold">Archivos requeridos:</div>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<RequiredCard 
						title="RQ" 
						code="rq" 
						years={years} 
						currentYear={currentYear}
						state={files} 
						setState={setFiles} 
						templateHref="/plantillas/TS 03.10 Historico de RQs - Nuevas Columnas v2_Reporte Excel 1.0.xlsx" 
					/>
					<RequiredCard 
						title="Orden de Compra" 
						code="oc" 
						years={years} 
						currentYear={currentYear}
						state={files} 
						setState={setFiles} 
						templateHref="/plantillas/TS 03.15 Orden de Compra_Reporte Excel 1.0.xlsx" 
					/>
					<RequiredCard 
						title="Actas" 
						code="ac" 
						years={years} 
						currentYear={currentYear}
						state={files} 
						setState={setFiles} 
						templateHref="/plantillas/TS 03.16 Códigos Recepción - Nuevas Columnas_Reporte.xlsx" 
					/>
				</div>
			</div>

			{/* 2) OPCIONALES con colapsable */}
			<div className="mb-6">
				<OptionalBlock state={files} setState={setFiles} />
			</div>

			<div className="mb-10 flex justify-end">
				<Button onClick={onUploadAll} disabled={loading} className="min-w-[210px]">
					{loading && <Loader2 className="h-4 w-4 animate-spin" />} Subir Documentos
				</Button>
			</div>

			{/* 3) HISTÓRICO */}
			<Card>
				<CardContent>
				<div className="mb-3 text-base font-semibold">Histórico de cargas</div>
				<div className="overflow-auto rounded-xl border">
					<table className="w-full border-collapse text-sm">
					<thead className="bg-gray-50">
						<tr>
						<th className="border-b px-3 py-2 text-left">Año</th>
						<th className="border-b px-3 py-2 text-left">Documento</th>
						<th className="border-b px-3 py-2 text-left">Archivo</th>
						<th className="border-b px-3 py-2 text-left">Fecha de carga</th>
						</tr>
					</thead>
					<tbody>
						{history.length === 0 ? (
						<tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">Aún no hay cargas en esta sesión.</td></tr>
						) : history.map((h, i) => (
						<tr key={i} className="even:bg-gray-50/60">
							<td className="border-b px-3 py-2">{h.year ?? "—"}</td>
							<td className="border-b px-3 py-2">{h.doc}</td>
							<td className="border-b px-3 py-2">{h.filename}</td>
							<td className="border-b px-3 py-2">{new Date(h.at).toLocaleString()}</td>
						</tr>
						))}
					</tbody>
					</table>
				</div>
				</CardContent>
			</Card>
		</div>
    )
}