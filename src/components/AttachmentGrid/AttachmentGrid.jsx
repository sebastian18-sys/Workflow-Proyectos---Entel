import { useMemo, useState } from "react";
import {
    Download,
    Eye,
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    Mail,
    Upload,
    UploadCloud
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { toast } from "wc-toast";
import { Spinner } from "../ui/spinner";

function formatDate(date) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(date));
}

function formatSize(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileTypeLabel(mimetype = "", originalName = "") {
    const ext = originalName.split(".").pop()?.toLowerCase();

    if (mimetype.startsWith("image/")) return "Imagen";
    if (mimetype.includes("pdf")) return "PDF";
    if (mimetype.includes("spreadsheet") || ["xlsx", "xls", "csv"].includes(ext)) return "Excel";
    if (mimetype === "message/rfc822" || ext === "eml") return "Email";
    if (mimetype.startsWith("text/")) return "Texto";
    return "Archivo";
}

function getFileIcon(mimetype = "", originalName = "") {
    const ext = originalName.split(".").pop()?.toLowerCase();

    if (mimetype.startsWith("image/")) return <FileImage className="h-9 w-9 text-[#2b7fff]" />;
    if (mimetype.includes("spreadsheet") || ["xlsx", "xls", "csv"].includes(ext)) {
        return <FileSpreadsheet className="h-9 w-9 text-emerald-600" />;
    }
    if (mimetype === "message/rfc822" || ext === "eml") return <Mail className="h-9 w-9 text-orange-500" />;
    if (mimetype.includes("pdf") || mimetype.startsWith("text/")) return <FileText className="h-9 w-9 text-red-500" />;
    return <File className="h-9 w-9 text-slate-500" />;
}

function isImageFile(file) {
    return file?.mimetype?.startsWith("image/");
}

function isPreviewable(file) {
    const ext = file?.originalName?.split(".").pop()?.toLowerCase();
    return (
        file?.mimetype?.startsWith("image/") ||
        file?.mimetype?.includes("pdf") ||
        file?.mimetype?.startsWith("text/") ||
        file?.mimetype === "message/rfc822" ||
        ext === "eml"
    );
}

function AttachmentPreview({ file }) {
    if (!file) return null;

    if (isImageFile(file)) {
        return (
        <img
            src={file.viewUrl}
            alt={file.originalName}
            className="h-full w-full object-cover"
        />
        );
    }

    const typeLabel = getFileTypeLabel(file.mimetype, file.originalName);

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/40 px-4 text-center">
        {getFileIcon(file.mimetype, file.originalName)}
        <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{typeLabel}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
            {file.originalName}
            </p>
        </div>
        </div>
    );
}


export default function AttachmentsGrid({ 
    files = [], 
    download, 
    downloadAllSustentos, 
    loadingDownload,
    editing = false, 
    inputRef = null 
}) {

    const handleDownload = async (idx) => {

        const resp = await download(files[idx].name)

        const blob = resp
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = files[idx].name || "archivo.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Archivo descargado correctamente")

    }

    const handleDownloadAllSustentos = async () => {

        const resp = await downloadAllSustentos()

        const blob = resp
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "archivo.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Archivo descargado correctamente")

    }

    const [selectedFile, setSelectedFile] = useState(null);

    const normalizedFiles = useMemo(() => {
        return files.map((file) => ({
            ...file,
            viewUrl: file.viewUrl || `/api/files/${file._id}/view`,
            downloadUrl: file.downloadUrl || `/api/files/${file._id}/download`,
        }));
    }, [files]);

    return (
        <>
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Adjuntos</Label>
                    <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-sm">
                        {normalizedFiles.length}
                    </Badge>
                </div>
                {normalizedFiles.length > 1 && (
                    <Button
                        size="icon"
                        variant="secondary"
                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border-2 bg-white px-3 py-2 text-sm font-medium leading-6 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-2 focus:outline-solid focus:outline-offset-2 outline-blue-300 dark:text-violet-100 dark:hover:text-violet-100 whitespace-nowrap w-auto shrink-0"
                        onClick={handleDownloadAllSustentos}
                    >
                        {loadingDownload ? (
                            <Spinner />
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Descargar Todo
                            </>
                            
                        )}
                    </Button>
                )}
            </div>

            {normalizedFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-sm text-muted-foreground">
                No hay archivos adjuntos.
            </div>
            ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 xl:grid-cols-4">
                {normalizedFiles.map((file, idx) => (
                <Card
                    key={file._id || file.filename}
                    className="p-0 group overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
                >
                    <CardContent className="p-0">
                    <div className="relative h-36 overflow-hidden border-b bg-slate-100">
                        <AttachmentPreview file={file} />

                        <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity group-hover:opacity-100" />

                            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-all group-hover:opacity-100">
                            {isPreviewable(file) && (
                                <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 bg-white/95 shadow hover:bg-white"
                                onClick={() => setSelectedFile(file)}
                                >
                                <Eye className="h-5 w-5" />
                                </Button>
                            )}

                            {/* {editing && (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="cursor-pointer"
                                    asChild
                                    onClick={() => inputRef.current?.click()}
                                >
                                    <Upload className="mr-2 w-8 h-8 p-2" />
                                </Button>
                            )} */}

                            <Button
                                size="icon"
                                variant="secondary"
                                className="cursor-pointer"
                                asChild
                                download 
                                onClick={() => handleDownload(idx)}
                            >
                                <Download className="mr-2 w-8 h-8 p-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1 p-3">
                        <p className="truncate text-[15px] font-semibold text-foreground">
                            {file.name}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">
                            {formatDate(file.uploadedAt)}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                            {formatSize(file.size)}
                        </span>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
            )}
        </div>

        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
            <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle className="truncate pr-8">
                {selectedFile?.originalName}
                </DialogTitle>
            </DialogHeader>

            {selectedFile && (
                <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted/20 p-2">
                {isImageFile(selectedFile) ? (
                    <img
                    src={selectedFile.viewUrl}
                    alt={selectedFile.originalName}
                    className="mx-auto max-h-[70vh] rounded-md object-contain"
                    />
                ) : selectedFile.mimetype?.includes("pdf") ? (
                    <iframe
                    src={selectedFile.viewUrl}
                    title={selectedFile.originalName}
                    className="h-[70vh] w-full rounded-md"
                    />
                ) : (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                    {getFileIcon(selectedFile.mimetype, selectedFile.originalName)}
                    <div className="space-y-2">
                        <p className="font-medium">{selectedFile.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                        Vista previa no disponible para este tipo de archivo.
                        </p>
                    </div>
                    <Button asChild>
                        <a
                        href={selectedFile.downloadUrl}
                        download={selectedFile.originalName}
                        target="_blank"
                        rel="noreferrer"
                        >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar archivo
                        </a>
                    </Button>
                    </div>
                )}
                </div>
            )}
            </DialogContent>
        </Dialog>
        </>
    );
}