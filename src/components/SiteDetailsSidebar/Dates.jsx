import {
    CalendarDays,
    Clock3,
    CheckCircle2,
    Loader2,
    Pencil
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useInstanceForecasts } from "@/hooks/projects/wf/useInstanceForecasts"

export default function Dates({
    instanceId,
    instance,
    currentUser
}) {

    const {
        saving,
        updateForecast
    } = useInstanceForecasts(instanceId, { enabled: false })

    const tasks =
        (instance?.nodes || [])
            .filter(
                node =>
                    node.task_code
            )

    const handleForecast =
        async(
            taskCode,
            forecastSource,
            date,
            reason
        ) => {
            await updateForecast(
                taskCode,
                {
                    date,
                    forecast_source: forecastSource,
                    type: "CHANGE",
                    reason,
                    user_id: String(currentUser?.id)
                }
            )
        }


    if (!tasks.length) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-sm text-slate-400">
                No existen fechas registradas.
            </div>
        )
    }

    return (
        <div className="space-y-4">

            {tasks.map(task => (

                <div
                    key={
                        task.node_key
                    }
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >

                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                        <div>
                            <div className="font-semibold text-slate-700">
                                {
                                    task.task_name ||
                                    task.task_code
                                }
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                                {
                                    task.task_code
                                }
                            </div>
                        </div>

                        <TaskStatusBadge
                            status={
                                task.status
                            }
                        />

                    </div>


                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">

                        <DateItem
                            icon={Clock3}
                            label="Inicio"
                            value={
                                task.started_at
                            }
                        />

                        <DateItem
                            icon={CalendarDays}
                            label="FCST SLA"
                            value={
                                task.forecast?.sla_date
                            }
                        />

                        <DateItem
                            icon={CalendarDays}
                            label="FCST Responsable"
                            value={
                                task.forecast?.responsible_date
                            }
                        />

                        <DateItem
                            icon={CalendarDays}
                            label="FCST PM"
                            value={
                                task.forecast?.pm_date
                            }
                        />

                        <DateItem
                            icon={CheckCircle2}
                            label="Finalización"
                            value={
                                task.finished_at
                            }
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}


/*
 * =========================================================
 * DATE ITEM
 * =========================================================
 */

function DateItem({
    icon: Icon,
    label,
    value
}) {

    return (

        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">

            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">

                <Icon className="h-3.5 w-3.5" />

                {
                    label
                }

            </div>

            <div className="mt-2 text-sm font-semibold text-slate-700">
                {
                    formatDate(
                        value
                    )
                }
            </div>

        </div>

    )
}


/*
 * =========================================================
 * BADGES
 * =========================================================
 */

function TaskStatusBadge({
    status
}) {

    const config = {

        NOT_REACHED: [
            "No iniciada",
            "border-slate-200 bg-slate-50 text-slate-500"
        ],

        ACTIVE: [
            "En curso",
            "border-blue-200 bg-blue-50 text-blue-700"
        ],

        COMPLETED: [
            "Completada",
            "border-emerald-200 bg-emerald-50 text-emerald-700"
        ],

        CANCELLED: [
            "Cancelada",
            "border-red-200 bg-red-50 text-red-600"
        ],

        ERROR: [
            "Error",
            "border-red-200 bg-red-50 text-red-600"
        ]
    }


    const [
        label,
        className
    ] =
        config[status] ||
        [
            status || "-",
            "border-slate-200 bg-slate-50 text-slate-500"
        ]


    return (

        <Badge
            variant="outline"
            className={className}
        >
            {
                label
            }
        </Badge>

    )
}


function ForecastSourceBadge({
    source
}) {

    const labels = {

        AUTO_SLA:
            "SLA",

        RESPONSIBLE:
            "Responsable",

        PM:
            "PM",

        MANUAL:
            "Manual"
    }


    return (

        <Badge
            variant="outline"
            className="border-blue-100 bg-blue-50 text-[10px] text-blue-600"
        >
            {
                labels[source] ||
                source ||
                "-"
            }
        </Badge>

    )
}


function formatDate(
    value
) {

    if (!value) return "-"

    const date =
        new Date(value)

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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