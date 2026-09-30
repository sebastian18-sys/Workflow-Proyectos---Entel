import { useMemo, useState } from "react"

import {
    ArrowLeft,
    Info,
    Route,
    ClipboardList,
    CalendarDays,
    History,
    MessageSquare,
    RefreshCw
} from "lucide-react"

import { useNavigate, useParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// import Information from "./components/Information"
// import SiteJourney from "./components/SiteJourney"
// import CurrentActivity from "./components/CurrentActivity"
// import Dates from "./components/Dates"
// import SiteHistory from "./components/SiteHistory"
// import SiteChat from "./components/SiteChat"

// import { useSiteDetails } from "@/hooks/projects/wf/useSiteDetails"
import SiteDetailsSidebar from "@/components/SiteDetailsSidebar/SiteDetailsSidebar"
import Information from "@/components/SiteDetailsSidebar/Information"
import SiteJourney from "@/components/SiteDetailsSidebar/SiteJourney"
import CurrentActivity from "@/components/SiteDetailsSidebar/CurrentActivity"
import Dates from "@/components/SiteDetailsSidebar/Dates"
import SitesHistory from "@/components/SiteDetailsSidebar/SitesHistory"
import SiteChat from "@/components/SiteDetailsSidebar/SiteChat"
import { useAuth } from "@/hooks/useAuth"
import { useSiteDetails } from "@/hooks/projects/wf/useSiteDetails"
import { useAuthz } from "@/hooks/useAuthz"


const SECTIONS = [
    {
        id: "activity",
        label: "Subtareas",
        icon: ClipboardList
    },
    {
        id: "chat",
        label: "Chat",
        icon: MessageSquare
    },
    {
        id: "journey",
        label: "Viaje del sitio",
        icon: Route
    },
    {
        id: "information",
        label: "Información",
        icon: Info
    },
    
    // {
    //     id: "dates",
    //     label: "Fechas",
    //     icon: CalendarDays
    // },
    {
        id: "history",
        label: "Historial",
        icon: History
    },
    
]


function SummaryItem({
    label,
    value
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-700">
                {value ?? "-"}
            </div>
        </div>
    )
}

function InstanceStatusBadge({
    status
}) {

    const config = {
        PENDING: {
            label: "Pendiente",
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

    const current = config[status] || {
        label: status || "-",
        className: "border-slate-200 bg-slate-50 text-slate-600"
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


function SiteDetailsSkeleton() {
    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8">
            <div className="w-full max-w-[1600px]">
                <div className="mb-6 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-56" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({
                        length: 4
                    }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="h-[72px] rounded-xl"
                        />
                    ))}
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex min-h-[680px]">
                        <div className="hidden w-[220px] border-r border-slate-200 p-4 md:block">
                            <div className="space-y-3">
                                {Array.from({
                                    length: 6
                                }).map((_, index) => (
                                    <Skeleton
                                        key={index}
                                        className="h-10 w-full rounded-xl"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 p-8">
                            <Skeleton className="mb-6 h-6 w-48" />
                            <Skeleton className="h-[420px] w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default function SiteDetails() {

    const { can } = useAuthz()
    const { user } = useAuth()
    const { instanceId } = useParams()

    const navigate = useNavigate()
    const [section, setSection] = useState("activity")

    const {
        data,
        site,
        instance,
        loading,
        error,
        reload
    } = useSiteDetails(instanceId)

    const tasks = useMemo(
        () =>
            (instance?.nodes || [])
                .filter(node =>
                    node.type === "TASK" || !!node.task_code
                ),
        [instance]
    )

    if (loading) {
        return (
            <SiteDetailsSkeleton />
        )
    }

    const selectedSection = SECTIONS.find(item => item.id === section)

    const handleSendComment = async message => {

        await addSiteComment({
            instance_id: instance._id,
            message,
            user_id: String(user?.id)
        })

        reload()
    }

    if (error || !data) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="text-sm font-medium text-red-500">
                        No se pudo cargar el detalle del sitio
                    </div>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={reload}
                    >
                        Reintentar
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1600px] flex-col">

                {/* =============================================
                    HEADER
                ============================================= */}
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-white text-slate-400"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-semibold text-[#2b7fff]">
                                    {site.site}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={reload}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Actualizar
                    </Button>
                </div>
                {/* =============================================
                    SUMMARY
                ============================================= */}
                {/* <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <SummaryItem
                        label="Proyecto"
                        value={site?.project_code || "-"}
                    />
                    <SummaryItem
                        label="Workflow"
                        value={instance.workflow_code || "-"}
                    />
                    <SummaryItem
                        label="TASK actual"
                        value={activeTask?.task_name || "-"}
                    />
                    <SummaryItem
                        label="Estado"
                        value={activeTask?.status || "-"}
                    />
                </div> */}
                {/* =============================================
                    CONTENT
                ============================================= */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex min-h-[680px]">
                        {/* SIDEBAR */}
                        <SiteDetailsSidebar
                            allSections={SECTIONS}
                            section={section}
                            setSection={setSection}
                        />

                        {/* MAIN */}
                        <main className="min-w-0 flex-1">
                            <div className="border-b border-slate-100 px-8 py-5">
                                <div className="text-lg font-semibold text-slate-800">
                                    {SECTIONS.find(item => item.id === section)?.label}
                                </div>
                            </div>
                            <div className="p-6 lg:p-3">
                                {section === "information" && (
                                    <Information
                                        site={site}
                                        instance={instance}
                                    />
                                )}
                                {section === "journey" && (
                                    <SiteJourney
                                        instanceId={instanceId}
                                    />
                                )}
                                {section === "activity" && (
                                    <CurrentActivity
                                        instance={instance}
                                        tasks={tasks}
                                        currentUser={user}
                                        onUpdated={reload}
                                        can={can}
                                    />
                                )}
                                {section === "dates" && (
                                    <Dates
                                        instance={instance}
                                        instanceId={instanceId}
                                        currentUser={user}
                                    />
                                )}
                                {section === "history" && (
                                    <SitesHistory
                                        instanceId={instanceId}
                                    />
                                )}
                                {section === "chat" && (
                                    <SiteChat
                                        instanceId={instanceId}
                                        instance={instance}
                                        currentUser={user}
                                        can={can}
                                    />
                                )}
                            </div>
                        </main>
                    </div>
                </div>

            </div>
        </div>
    )
}