import {
    Building2,
    Workflow,
    MapPin
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

function SectionCard({
    title,
    description,
    icon: Icon,
    children
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                {Icon && (
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
                <div>
                    <div className="text-sm font-semibold text-slate-700">
                        {title}
                    </div>
                    {description && (
                        <div className="mt-0.5 text-xs text-slate-400">
                            {description}
                        </div>
                    )}
                </div>
            </div>
            <div className="p-5">
                { children}
            </div>
        </section>
    )
}

function InfoGrid({
    children
}) {
    return (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            {children}
        </div>
    )
}

function InfoItem({
    label,
    value,
    children
}) {
    return (
        <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="mt-1 min-h-5 text-sm font-medium text-slate-700">
                {children ?? (value || "-")}
            </div>
        </div>
    )
}

function formatDate(value) {

    if (!value) {
        return "-"
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date)
}

function InstanceStatusBadge({
    status
}) {

    const config = {

        PENDING: {
            label:"Pendiente",
            className: "border-slate-200 bg-slate-50 text-slate-600"
        },
        ACTIVE: {
            label: "En curso",
            className: "border-blue-200 bg-blue-50 text-blue-700"
        },
        COMPLETED: {
            label: "Completado",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700"
        },
        CANCEL_PENDING: {
            label: "Cancelación pendiente",
            className: "border-amber-200 bg-amber-50 text-amber-700"
        },
        CANCELLED: {
            label: "Cancelado",
            className: "border-red-200 bg-red-50 text-red-600"
        },
        ERROR: {
            label: "Error",
            className: "border-red-200 bg-red-50 text-red-600"
        }
    }


    const current =
        config[status] || {
            label: status || "-",
            className: "border-slate-200 bg-slate-50 text-slate-500"
        }


    return (
        <Badge
            variant="outline"
            className={`whitespace-nowrap ${current.className}`}
        >
            {current.label}
        </Badge>
    )
}


export default function Information({
    site,
    instance
}) {
    return (
        <div className="space-y-5">
            {/* =================================================
                SITE
            ================================================= */}
            <SectionCard
                title="Información del sitio"
                description="Datos generales asociados al sitio."
                icon={MapPin}
            >
                <InfoGrid>
                    <InfoItem
                        label="Identificador"
                        value={instance?.identificador}
                    />
                    <InfoItem
                        label="Sitio"
                        value={site?.site}
                    />
                    <InfoItem
                        label="Proyecto"
                        value={site?.macro_project}
                    />
                    <InfoItem
                        label="Nombre proyecto"
                        value={site?.sub_project}
                    />
                    <InfoItem
                        label="Torrera"
                        value={site?.tower}
                    />
                </InfoGrid>
            </SectionCard>

            {/* =================================================
                WORKFLOW
            ================================================= */}
            <SectionCard
                title="Workflow"
                description="Información de la instancia actualmente asociada."
                icon={Workflow}
            >
                <InfoGrid>
                    <InfoItem
                        label="Workflow"
                        value={instance?.workflow_code}
                    />
                    <InfoItem
                        label="Versión"
                        value={instance?.workflow_version
                            ? `v${instance.workflow_version}`
                            : "-"
                        }
                    />
                    <InfoItem
                        label="Estado"
                    >
                        <InstanceStatusBadge
                            status={instance?.status}
                        />
                    </InfoItem>
                    <InfoItem
                        label="Fecha inicio"
                        value={
                            formatDate(instance?.workflow_start_date)}
                    />
                    <InfoItem
                        label="Inicio real"
                        value={formatDate(instance?.started_at)}
                    />
                    <InfoItem
                        label="Finalización"
                        value={formatDate(instance?.finished_at)}
                    />
                </InfoGrid>
            </SectionCard>
        </div>
    )
}