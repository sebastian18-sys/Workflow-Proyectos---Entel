import {
    CircleDot,
    MessageSquare,
    UserRound,
    History as HistoryIcon,
    Loader2
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useSiteEvents } from "@/hooks/projects/wf/useSiteEvents"


export default function SitesHistory({
    instanceId
}) {

    const {
        events,
        loading,
        error,
        reload
    } = useSiteEvents(instanceId, {}, true)

    if (loading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando historial...
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
                No se pudo cargar el historial.
            </div>
        )
    }

    if (!events.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <HistoryIcon className="mx-auto h-7 w-7 text-slate-300" />
                <div className="mt-3 text-sm font-medium text-slate-500">
                    Sin eventos
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="absolute bottom-4 left-[15px] top-4 w-px bg-slate-200" />
            <div className="space-y-5">
                {events.map(
                    (event, index) => (
                        <EventItem
                            key={event._id || index}
                            event={event}
                        />
                    )
                )}
            </div>
        </div>
    )
}

/*
 * =========================================================
 * EVENT
 * =========================================================
 */

function EventItem({
    event
}) {

    return (
        <div className="relative flex gap-4">
            <div className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-blue-100 bg-blue-50">
                <CircleDot className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white p-4">
                <div className="text-sm font-semibold text-slate-700">
                    {event.description || event.event_type || "Evento"}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-slate-400">
                    {event.user_id && (
                        <div className="flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            {event.user_name || event.user_id}
                        </div>
                    )}
                    <span>
                        {formatDateTime(event.createdAt)}
                    </span>
                </div>
                {(event.comment ||
                    event.data?.comment) && (
                    <div className="mt-3 flex gap-2 rounded-lg bg-slate-50 p-3">
                        <MessageSquare className="mt-0.5 h-4 w-4 flex-none text-slate-400" />
                        <div className="text-sm text-slate-600">
                            {event.comment || event.data?.comment}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


function formatDateTime(
    value
) {

    if (!value) return "-"

    return new Intl.DateTimeFormat(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(value)
    )
}