import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router"

const statusConfig = {
    success: {
        title: "Operación exitosa",
        icon: CheckCircle2,
        alertClass: "border-green-200 bg-green-50 text-green-900",
        iconClass: "text-green-600",
    },
    warning: {
        title: "Advertencia",
        icon: AlertTriangle,
        alertClass: "border-amber-200 bg-amber-50 text-amber-900",
        iconClass: "text-amber-600",
    },
    error: {
        title: "Error",
        icon: XCircle,
        alertClass: "border-red-200 bg-red-50 text-red-900",
        iconClass: "text-red-600",
    }
}

const formatMoney = (value) => {
    const n = Number(value ?? 0);

    return `S/ ${new Intl.NumberFormat("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0)}`;
};

const formatDetailValue = (detail) => {
    if (detail?.format === "money") return formatMoney(detail.value);
    if (detail?.value === null || detail?.value === undefined || detail?.value === "") return "-";
    return String(detail.value);
};

function normalizeDetails(details) {
    if (Array.isArray(details)) {
        return {
            errors: details,
            warnings: [],
        };
    }

    return {
        errors: details?.errors ?? [],
        warnings: details?.warnings ?? [],
    };
}

// function AlertSection({ title, items = [], className }) {
//     if (!items.length) return null;

//     return (
//         <div className={cn("space-y-3 rounded-md border p-3", className)}>
//             <p className="text-sm font-semibold">{title}</p>

//             <ul className="space-y-3 text-sm">
//                 {items.map((item, i) => (
//                     <li key={item.id ?? i} className="break-words">
//                         <div className="font-medium">
//                             • {item.mensaje}
//                         </div>

//                         {item.detalle?.length > 0 ? (
//                             <div className="ml-4 mt-2 grid gap-1 rounded-md bg-slate-50 p-2 text-xs text-slate-700">
//                                 {item.detalle.map((detail, idx) => (
//                                     <div key={idx} className="flex justify-between gap-4">
//                                         <span className="text-slate-500">{detail.label}</span>
//                                         <span className="text-right font-medium">
//                                             {formatDetailValue(detail)}
//                                         </span>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : null}
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     );
// }

function AlertSection({ title, items = [], className }) {
    if (!items.length) return null;

    const renderDetailValue = (detail) => {
        const isList = detail.type === "list" || Array.isArray(detail.value);

        if (isList && Array.isArray(detail.value)) {
            return (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-left font-normal text-slate-700">
                    {detail.value.map((v, idx) => (
                        <li key={idx} className="break-words">
                            {v}
                        </li>
                    ))}
                </ul>
            );
        }

        return formatDetailValue(detail);
    };

    return (
        <div className={cn("space-y-3 rounded-md border p-3", className)}>
            <p className="text-sm font-semibold">{title}</p>

            <ul className="space-y-3 text-sm">
                {items.map((item, i) => (
                    <li key={item.id ?? i} className="break-words">
                        <div className="font-medium">
                            • {item.mensaje}
                        </div>

                        {item.detalle?.length > 0 ? (
                            <div className="ml-4 mt-2 grid gap-2 rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                                {item.detalle.map((detail, idx) => {
                                    const isList = detail.type === "list" || Array.isArray(detail.value);

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                isList
                                                    ? "space-y-1"
                                                    : "flex justify-between gap-4"
                                            )}
                                        >
                                            <span className="text-slate-500">
                                                {detail.label}
                                            </span>

                                            <span
                                                className={cn(
                                                    "font-medium",
                                                    isList ? "block text-left" : "text-right"
                                                )}
                                            >
                                                {renderDetailValue(detail)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function StatusModal({
    open,
    onOpenChange,
    type,
    title,
    message,
    details = [],
    route = ""
}) {

    const navigate = useNavigate()
    const cfg = statusConfig[type]
    const Icon = cfg.icon

    const groupedDetails = normalizeDetails(details);
    const hasDetails = groupedDetails.errors.length > 0 || groupedDetails.warnings.length > 0;

    const handleClose = () => {
        onOpenChange(false)
        if (route !== "") navigate(route)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[650px] overflow-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", cfg.iconClass)} />
                        {title || cfg.title}
                    </DialogTitle>
                    {message ? (
                        <DialogDescription>
                            {message}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                <Alert className={cn("mt-2", cfg.alertClass)}>
                    <AlertTitle>
                        {type === "error" 
                            ? "Se detectaron problemas" 
                            : type === "warning"
                                ? "Solicitud registrada con advertencias"
                                : "Detalle"}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        {hasDetails ? (
                            <ScrollArea className="max-h-[360px] rounded-md border">
                                <div className="space-y-3">
                                    <AlertSection
                                        title="No se puede registrar por los siguientes errores:"
                                        items={groupedDetails.errors}
                                        className="border-red-100 bg-red-50"
                                    />

                                    <AlertSection
                                        title="La solicitud ingresará con las siguientes advertencias:"
                                        items={groupedDetails.warnings}
                                        className="border-amber-100 bg-amber-50"
                                    />
                                </div>
                            </ScrollArea>
                        ) : (
                            <p className="text-sm whitespace-pre-wrap break-words">
                                {message}
                            </p>
                        )}
                    </AlertDescription>
                </Alert>

                <div className="mt-4 flex justify-end">
                    <Button onClick={handleClose}>OK</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}