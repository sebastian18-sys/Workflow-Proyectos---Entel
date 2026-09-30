import { useRef, useState } from "react";
import { FileText, FileSpreadsheet, UploadCloud, X, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatFileSize(bytes = 0) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const DEFAULT_EXTENSIONS = [".xlsx", ".pdf", ".zip", ".rar", ".jpg", ".png"]

function isAllowedFile(file, allowedExtensions = DEFAULT_EXTENSIONS) {
    if (!file) return false
    const name = file.name?.toLowerCase() || ""
    return allowedExtensions.some(ext => name.endsWith(ext.toLowerCase()))
}

function fileKey(file) {
	return `${file.name}-${file.size}-${file.lastModified}`;
}

function FileIcon({ file }) {
	const name = file.name?.toLowerCase() || "";
	const type = file.type || "";

	if (type === "application/pdf" || name.endsWith(".pdf")) {
		return <FileText className="h-5 w-5 text-red-500" />;
	}

	return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
}

export default function Dropzone({
	files = [],
	onFilesChange,
	error,
	setError,
	maxFiles = 10,
	multiple = true,
	allowedExtensions = DEFAULT_EXTENSIONS,
	accept = ".xlsx,.pdf,.zip,.rar,.jpg,.png",
	helperText = "Formatos permitidos: XLSX, PDF, ZIP, RAR, JPG y PNG",
}) {

	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef(null);

	const handleFiles = (fileList) => {
		if (!fileList || !fileList.length) return;

		const incomingFiles = Array.from(fileList);

		const validFiles = incomingFiles.filter(file => isAllowedFile(file, allowedExtensions))
		const invalidFiles = incomingFiles.filter(file => !isAllowedFile(file, allowedExtensions))

		if (invalidFiles.length > 0 && setError) {
			setError(`Formato no permitido. Permitidos: ${allowedExtensions.join(", ")}`)
		} else if (setError) {
			setError("")
		}

		if (!validFiles.length) return

		const merged = multiple ? [...files, ...validFiles] : [validFiles[0]]
		const uniqueFiles = merged.filter(
			(file, index, self) =>
				index === self.findIndex(f => fileKey(f) === fileKey(file))
		)
		const limitedFiles = uniqueFiles.slice(0, maxFiles)
		onFilesChange(limitedFiles)
	};


	// const [isDragOver, setIsDragOver] = useState(false);
	// const inputRef = useRef(null);

	// const handleFiles = (fileList) => {
	// 	if (!fileList || !fileList.length) return;

	// 	const incomingFiles = Array.from(fileList);

	// 	const validFiles = incomingFiles.filter(isAllowedFile);
	// 	const invalidFiles = incomingFiles.filter((file) => !isAllowedFile(file));

	// 	if (invalidFiles.length > 0 && setError) {
	// 		setError("Solo se permiten archivos XLSX, PDF, ZIP y RAR.");
	// 	} else if (setError) {
	// 		setError("");
	// 	}

	// 	if (!validFiles.length) return;

	// 	const merged = [...files, ...validFiles];

	// 	// eliminar duplicados por nombre + tamaño + lastModified
	// 	const uniqueFiles = merged.filter(
	// 		(file, index, self) =>
	// 			index === self.findIndex((f) => fileKey(f) === fileKey(file))
	// 	);

	// 	const limitedFiles = uniqueFiles.slice(0, maxFiles);

	// 	if (uniqueFiles.length > maxFiles && setError) {
	// 		setError(`Solo puedes cargar hasta ${maxFiles} archivos.`);
	// 	}

	// 	onFilesChange(limitedFiles);
	// };


	const removeFile = (fileToRemove) => {
		const updatedFiles = files.filter((file) => fileKey(file) !== fileKey(fileToRemove));
		onFilesChange(updatedFiles);

		if (setError) setError("");
	};

	return (
		<div className="space-y-2">
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setIsDragOver(false);
					handleFiles(e.dataTransfer.files);
				}}
				onClick={() => inputRef.current?.click()}
				className={cn(
					"w-full cursor-pointer rounded-2xl border-2 border-dashed transition",
					isDragOver
						? "border-blue-500 bg-blue-50"
						: "border-muted-foreground/30 bg-background hover:bg-muted/30"
				)}
			>
				{files.length === 0 ? (
					<div className="flex h-40 flex-col items-center justify-center px-4 text-center">
						<div className="mb-3 rounded-full bg-muted p-3">
							<UploadCloud className="h-6 w-6 text-muted-foreground" />
						</div>
						<p className="text-sm font-medium">Arrastra y suelta tus archivos aquí</p>
						<p className="text-xs text-muted-foreground">
							o haz clic para seleccionar
						</p>
						<p className="mt-2 text-[11px] text-muted-foreground">
							{helperText}
						</p>
					</div>
				) : (
					<div className="space-y-3 p-3">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium">Archivos cargados</p>
								<p className="text-xs text-muted-foreground">
									{files.length} archivo{files.length > 1 ? "s" : ""}
								</p>
							</div>

							<div className="rounded-lg border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
								XLSX / PDF / ZIP / RAR
							</div>
						</div>

						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2 max-h-64 space-y-2 overflow-auto pr-1">
							{files.map((file) => (
								<div
									key={fileKey(file)}
									className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm"
									onClick={(e) => e.stopPropagation()}
								>
									<div className="flex min-w-0 items-center gap-3">
										<div className="rounded-lg bg-muted p-2">
											<FileIcon file={file} />
										</div>

										<div className="min-w-0">
											<p className="truncate text-sm font-medium">
												{file.name}
											</p>
											<p className="text-xs text-muted-foreground">
												{formatFileSize(file.size)}
											</p>
										</div>
									</div>

									<button
										type="button"
										className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
										onClick={(e) => {
											e.stopPropagation();
											removeFile(file);
										}}
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							))}
						</div>

						<div className="rounded-xl border border-dashed bg-muted/20 px-3 py-2 text-center text-xs text-muted-foreground">
							Haz clic o arrastra más archivos para agregarlos
						</div>
					</div>
				)}
			</div>

			<Input
				ref={inputRef}
				type="file"
				multiple={multiple}
				accept={accept}
				className="hidden"
				// accept=".xlsx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				// className="hidden"
				onChange={(e) => {
					handleFiles(e.target.files);
					e.target.value = "";
				}}
			/>

			{error && <div className="text-sm text-red-600">{error}</div>}
		</div>
	);
}