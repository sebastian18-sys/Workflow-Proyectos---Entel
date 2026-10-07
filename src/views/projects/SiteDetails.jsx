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

import { Link, useNavigate, useParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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
    {
        id: "history",
        label: "Historial",
        icon: History
    },
    
]


function SiteDetailsSkeleton() {
    return (
        <div className="flex flex-col px-4 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">
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
                            className="rounded-xl"
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

    const [section, setSection] = useState("activity")

    const {
        data,
        site,
        instance,
        loading,
        error,
        reload
    } = useSiteDetails(instanceId)

    const tasks = useMemo(() =>
        (instance?.nodes || []).filter(node =>
            node.type === "TASK" || !!node.task_code
        ),
        [instance]
    )

    if (loading) {
        return (
            <SiteDetailsSkeleton />
        )
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
        <div className="flex flex-col px-4 py-5 md:pt-6 md:px-6 lg:pt-8 lg:px-8 lg:pb-12 xl:px-10 2xl:px-14">
            <div className="flex min-h-full w-full min-w-0 flex-col">

                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        {/* <Button
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
                        </div> */}
                        <Link
                            to="/projects/inbox"
                            title="Atrás" 
                            className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="text-2xl font-semibold">
                            <Link to="/projects/inbox" className="text-gray-400 hover:text-[#2b7fff] cursor-pointer">
                                Mi bandeja
                            </Link>
                            <span className="text-gray-400"> / </span>
                            <span className="text-[#2b7fff]">{site.site}</span>
                        </h2>
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
                
                {/* Summary */}
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