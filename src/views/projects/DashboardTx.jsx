import {
    Check,
    CheckCircle2,
    ChevronDown,
    FileCheck2,
    MapPin,
    Search,
    Target,
    UploadCloud,
    X,
    ArrowLeft,
    Gauge,
    Workflow,
    TriangleAlert
} from "lucide-react"
import { Link } from "react-router";
import {
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    LabelList,
    Legend,
    Line,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import {
    geoMercator,
    geoPath,
} from "d3-geo"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import peruDepartments from "../../constants/peru_departamentos.json"
import { data } from "../../constants/tmp_data_sites_transporte.js"
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ============================================================
   CONSTANTES
============================================================ */

const MONTHS = [
    "Ene.",
    "Feb.",
    "Mar.",
    "Abr.",
    "May.",
    "Jun.",
    "Jul.",
    "Ago.",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dic.",
]


const PROCESS_CONFIG = {

    ing: {
        key: "ing",
        label: "Ingeniería",

        // plannedField: "ing_date_planned",
        realField: "ing_date_real",

        bgColor: "#696969",

        lineColor: "#696969",
        textLineColor: "#696969",
    },

    rfi: {
        key: "rfi",
        label: "RFI",

        plannedField: "rfi_date_planned",
        realField: "rfi_date_real",

        bgColor: "#FD6C98",

        color: "#6b7280",
        barColor: "#FD6C98",

        lineColor: "#FF3D00",
        textLineColor: "#FF3D00"
    },

    activados: {
        key: "activados",
        label: "Implementado",

        plannedField: "activado_date_planned",
        realField: "activado_date_real",

        bgColor: "#A78BFA",

        color: "#7C3AED",
        barColor: "#A78BFA",

        lineColor: "#A78BFA",
        textLineColor: "#A78BFA"
    },

    migrados: {
        key: "migrados",
        label: "Migrados",

        plannedField: "migrado_date_planned",
        realField: "migrado_date_real",

        bgColor: "#43E7B4",

        color: "#7C3AED",
        barColor: "#43E7B4",

        lineColor: "#002EFF",
        textLineColor: "#002EFF"
    },
}


const PROCESS_OPTIONS = Object.values(PROCESS_CONFIG)


const CLUSTER_COLORS = [
    "#0B5CAD",
    "#2563EB",
    "#60A5FA",
    "#22C55E",
    "#F59E0B",
    "#CBD5E1",
]


const ZONE_COLORS = [
    "#2563EB",
    "#22C55E",
    "#7C3AED",
    "#F97316",
    "#94A3B8",
]


const MAP_COLORS = [
    "#F1F5F9",
    "#DBEAFE",
    "#BFDBFE",
    "#93C5FD",
    "#60A5FA",
    "#3B82F6",
    "#2563EB",
    "#1D4ED8",
    "#1E3A8A",
]


/* ============================================================
   HELPERS
============================================================ */

// function parseDMY(value) {
//     if (!value) return null

//     const parts = String(value)
//         .split("/")
//         .map(Number)

//     if (parts.length !== 3) {
//         return null
//     }

//     const [day, month, year] = parts

//     if (!day || !month || !year) {
//         return null
//     }

//     const date = new Date(
//         year,
//         month - 1,
//         day
//     )

//     if (Number.isNaN(date.getTime())) {
//         return null
//     }

//     return date
// }

const DASHBOARD_YEAR = 2026

function parseDMY(value) {
    if (!value) return null

    const parts = String(value)
        .split("/")
        .map(Number)

    if (parts.length !== 3) return null

    const [day, month, year] = parts

    if (!day || !month || !year) {
        return null
    }

    const date = new Date(
        year,
        month - 1,
        day
    )

    return Number.isNaN(date.getTime())
        ? null
        : date
}

function normalizeDashboardDate(value) {
    const date = parseDMY(value)

    if (!date) return null

    /*
     * Regla:
     * todo 2025 pasa a Enero 2026
     */
    if (date.getFullYear() === 2025) {
        return new Date(
            DASHBOARD_YEAR,
            0,
            date.getDate()
        )
    }

    return date
}

function isSameMonth(
    date,
    referenceDate
) {
    if (!date) return false

    return (
        date.getMonth() ===
            referenceDate.getMonth() &&
        date.getFullYear() ===
            referenceDate.getFullYear()
    )
}

function isAccumulatedUntilMonth(
    date,
    referenceDate
) {
    if (!date) return false

    return (
        date.getFullYear() ===
            referenceDate.getFullYear() &&
        date.getMonth() <=
            referenceDate.getMonth()
    )
}


function normalizeText(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim()
        .toUpperCase()
}


function normalizeDepartment(value = "") {
    return normalizeText(value)
        .replace(/^DEPARTAMENTO DE\s+/, "")
}

function toNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : 0
    }

    const parsed = Number(
        String(value)
            .replace(/,/g, "")
            .trim()
    )

    return Number.isFinite(parsed)
        ? parsed
        : 0
}

function formatNumber(value) {
    return Number(
        value || 0
    ).toLocaleString("en-US")
}


function uniqueRows(rows = []) {
    const map = new Map()

    rows.forEach((row) => {
        const key =
            row.identificador ??
            row.id

        map.set(key, row)
    })

    return [...map.values()]
}


function groupByCount(
    rows = [],
    field
) {
    const map = new Map()

    rows.forEach((row) => {
        const key =
            row?.[field] ||
            "SIN INFORMACIÓN"

        map.set(
            key,
            (map.get(key) || 0) + 1
        )
    })

    return [...map.entries()]
        .map(([name, value]) => ({
            name,
            value,
        }))
        .sort(
            (a, b) =>
                b.value - a.value
        )
}


function getGeoDepartmentName(feature) {
    const props =
        feature?.properties || {}

    return (
        props.NOMBDEP ||
        props.NOMB_DEPA ||
        props.DEPARTAMEN ||
        props.departamento ||
        props.NAME_1 ||
        props.NOMBRE ||
        props.name ||
        ""
    )
}


function getMapColor(
    value,
    maxValue
) {
    if (!value || !maxValue) {
        return MAP_COLORS[0]
    }

    const ratio =
        value / maxValue

    const index = Math.min(
        MAP_COLORS.length - 1,
        Math.max(
            1,
            Math.ceil(
                ratio *
                    (MAP_COLORS.length - 1)
            )
        )
    )

    return MAP_COLORS[index]
}

/* ============================================================
   CURVA S GENERAL
============================================================ */

// function buildGeneralSCurve(
//     rows,
//     year,
//     currentDate
// ) {
//     const base = MONTHS.map(
//         (month, monthIndex) => ({
//             month,
//             monthIndex,

//             rfiPlanMonthly: 0,
//             rfiRealMonthly: 0,

//             activadosPlanMonthly: 0,
//             activadosRealMonthly: 0,

//             migradosPlanMonthly: 0,
//             migradosRealMonthly: 0,
//         })
//     )

//     /*
//      * ---------------------------------------------------------
//      * Conteo mensual para los tres procesos
//      * ---------------------------------------------------------
//      */

//     rows.forEach((row) => {
//         PROCESS_OPTIONS.forEach(
//             (process) => {
//                 const planned =
//                     normalizeDashboardDate(
//                         row[
//                             process.plannedField
//                         ]
//                     )

//                 const real =
//                     normalizeDashboardDate(
//                         row[
//                             process.realField
//                         ]
//                     )


//                 if (
//                     planned &&
//                     planned.getFullYear() ===
//                         year
//                 ) {
//                     base[
//                         planned.getMonth()
//                     ][
//                         `${process.key}PlanMonthly`
//                     ] += 1
//                 }

//                 /*
//                  * Solo cuenta como REAL
//                  * lo ocurrido hasta currentDate.
//                  */
//                 if (
//                     real &&
//                     real.getFullYear() ===
//                         year &&
//                     real <= currentDate
//                 ) {
//                     base[
//                         real.getMonth()
//                     ][
//                         `${process.key}RealMonthly`
//                     ] += 1
//                 }
//             }
//         )
//     })

//     /*
//      * ---------------------------------------------------------
//      * Acumulados
//      * ---------------------------------------------------------
//      */
//     const accumulator = {
//         rfiPlan: 0,
//         rfiReal: 0,

//         activadosPlan: 0,
//         activadosReal: 0,

//         migradosPlan: 0,
//         migradosReal: 0,
//     }


//     const currentYear =
//         currentDate.getFullYear()

//     const currentMonth =
//         currentDate.getMonth()


//     return base.map((row) => {
//         PROCESS_OPTIONS.forEach(
//             (process) => {
//                 accumulator[
//                     `${process.key}Plan`
//                 ] +=
//                     row[
//                         `${process.key}PlanMonthly`
//                     ]

//                 accumulator[
//                     `${process.key}Real`
//                 ] +=
//                     row[
//                         `${process.key}RealMonthly`
//                     ]
//             }
//         )


//         const showReal =
//             year < currentYear ||
//             (
//                 year === currentYear &&
//                 row.monthIndex <=
//                     currentMonth
//             )


//         return {
//             ...row,

//             rfiPlanAccum:
//                 accumulator.rfiPlan,

//             rfiRealAccum:
//                 accumulator.rfiReal,

//             rfiRealAccumDisplay:
//                 showReal
//                     ? accumulator.rfiReal
//                     : null,


//             activadosPlanAccum:
//                 accumulator.activadosPlan,

//             activadosRealAccum:
//                 accumulator.activadosReal,

//             activadosRealAccumDisplay:
//                 showReal
//                     ? accumulator.activadosReal
//                     : null,


//             migradosPlanAccum:
//                 accumulator.migradosPlan,

//             migradosRealAccum:
//                 accumulator.migradosReal,

//             migradosRealAccumDisplay:
//                 showReal
//                     ? accumulator.migradosReal
//                     : null,
//         }
//     })
// }

function buildGeneralSCurve(rows, year, currentDate) {
    const base = MONTHS.map((month, monthIndex) => ({
        month,
        monthIndex,

        // INGENIERÍA
        ingRealMonthly: 0,

        // RFI
        rfiPlanMonthly: 0,
        rfiRealMonthly: 0,

        // ACTIVADOS
        activadosPlanMonthly: 0,
        activadosRealMonthly: 0,

        // MIGRADOS
        migradosPlanMonthly: 0,
        migradosRealMonthly: 0,
    }))

    /* =========================================================
       CONTEO MENSUAL
    ========================================================= */

    // console.log("rows", rows)
    
    rows.forEach((row) => {
        /* INGENIERÍA - solo REAL */
        
        // INGENIERÍA: una sola vez por registro
        // const ingReal = normalizeDashboardDate(row.ing_date_real)

        // if (ingReal && ingReal.getFullYear() === year && ingReal <= currentDate) {
        //     base[ingReal.getMonth()].ingRealMonthly += 1
        // }
        

        /* RFI / ACTIVADOS / MIGRADOS */
        PROCESS_OPTIONS.forEach((process) => {

            // const ingReal = normalizeDashboardDate(row[process.plannedField])
            const planned = normalizeDashboardDate(row[process.plannedField])
            const real = normalizeDashboardDate(row[process.realField])


            if (planned && planned.getFullYear() === year) {
                base[planned.getMonth()][`${process.key}PlanMonthly`] += 1
            }

            if (real && real.getFullYear() === year && real <= currentDate) {
                base[real.getMonth()][`${process.key}RealMonthly`] += 1
            }
        })
    })

    // console.log("base", base)

    // console.log(
    //     "TOTAL ING:",
    //     base.reduce((acc, item) => acc + item.ingRealMonthly, 0)
    // )

    /* =========================================================
       ÚLTIMO MES CON DATA DE CADA SERIE

       No se revisa el acumulado.
       Se revisa el dato mensual origen.
    ========================================================= */

    const lastIngRealIndex = getLastIndexWithData(base, "ingRealMonthly")

    const lastRfiPlanIndex = getLastIndexWithData(base, "rfiPlanMonthly")
    const lastRfiRealIndex = getLastIndexWithData(base, "rfiRealMonthly")

    const lastActivadosPlanIndex = getLastIndexWithData(base, "activadosPlanMonthly")
    const lastActivadosRealIndex = getLastIndexWithData(base, "activadosRealMonthly")

    const lastMigradosPlanIndex = getLastIndexWithData(base, "migradosPlanMonthly")
    const lastMigradosRealIndex = getLastIndexWithData(base, "migradosRealMonthly")

    /* =========================================================
       ACUMULADORES
    ========================================================= */

    const accumulator = {
        ingReal: 0,

        rfiPlan: 0,
        rfiReal: 0,

        activadosPlan: 0,
        activadosReal: 0,

        migradosPlan: 0,
        migradosReal: 0,
    }

    /* =========================================================
       ACUMULADOS + DISPLAY
    ========================================================= */

    return base.map((row, index) => {
        // accumulator.ingReal += row.ingRealMonthly

        PROCESS_OPTIONS.forEach((process) => {
            accumulator[`${process.key}Plan`] += row[`${process.key}PlanMonthly`]
            accumulator[`${process.key}Real`] += row[`${process.key}RealMonthly`]
        })

        return {
            ...row,

            /* =========================
               INGENIERÍA
            ========================= */

            ingRealAccum: accumulator.ingReal,
            ingRealAccumDisplay: index <= lastIngRealIndex
                ? accumulator.ingReal
                : null,

            /* =========================
               RFI
            ========================= */

            rfiPlanAccum: accumulator.rfiPlan,
            rfiPlanAccumDisplay: index <= lastRfiPlanIndex
                ? accumulator.rfiPlan
                : null,

            rfiRealAccum: accumulator.rfiReal,
            rfiRealAccumDisplay: index <= lastRfiRealIndex
                ? accumulator.rfiReal
                : null,

            /* =========================
               ACTIVADOS
            ========================= */

            activadosPlanAccum: accumulator.activadosPlan,
            activadosPlanAccumDisplay: index <= lastActivadosPlanIndex
                ? accumulator.activadosPlan
                : null,

            activadosRealAccum: accumulator.activadosReal,
            activadosRealAccumDisplay: index <= lastActivadosRealIndex
                ? accumulator.activadosReal
                : null,

            /* =========================
               MIGRADOS
            ========================= */

            migradosPlanAccum: accumulator.migradosPlan,
            migradosPlanAccumDisplay: index <= lastMigradosPlanIndex
                ? accumulator.migradosPlan
                : null,

            migradosRealAccum: accumulator.migradosReal,
            migradosRealAccumDisplay: index <= lastMigradosRealIndex
                ? accumulator.migradosReal
                : null,
        }
    })
}

function getLastIndexWithData(data, monthlyKey) {
    let lastIndex = -1

    data.forEach((item, index) => {
        if (Number(item?.[monthlyKey] || 0) > 0) {
            lastIndex = index
        }
    })

    return lastIndex
}


/* ============================================================
   SELECT SIMPLE
============================================================ */

function SimpleSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
}) {
    return (
        <div className="space-y-1.5">

            <label className="text-xs font-medium text-slate-700">
                {label}
            </label>

            <select
                value={value}
                onChange={(e) =>
                    onChange(
                        e.target.value
                    )
                }
                className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-3
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    focus:border-blue-400
                    focus:ring-2
                    focus:ring-blue-100
                "
            >
                <option value="">
                    {placeholder}
                </option>

                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                    >
                        {option}
                    </option>
                ))}

            </select>

        </div>
    )
}


/* ============================================================
   MULTISELECT MACROPROCESOS
============================================================ */

function MacroprocessMultiSelect({
    selected,
    onChange,
}) {
    const [open, setOpen] =
        useState(false)


    function toggleProcess(key) {
        const exists =
            selected.includes(key)

        /*
         * Evita dejar la gráfica
         * sin ninguna serie.
         */
        if (
            exists &&
            selected.length === 1
        ) {
            return
        }


        if (exists) {
            onChange(
                selected.filter(
                    (item) =>
                        item !== key
                )
            )

            return
        }


        onChange([
            ...selected,
            key,
        ])
    }


    function removeProcess(
        event,
        key
    ) {
        event.stopPropagation()

        if (
            selected.length === 1
        ) {
            return
        }

        onChange(
            selected.filter(
                (item) =>
                    item !== key
            )
        )
    }


    return (
        <div className="space-y-1.5">

            <label className="text-xs font-medium text-slate-700">Macroprocesos</label>
            <Popover
                open={open}
                onOpenChange={setOpen}
            >
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="
                            min-h-10
                            h-auto
                            w-full
                            justify-between
                            px-3
                            py-1.5
                            font-normal
                        "
                    >
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map(
                                (key) => {
                                    const process =
                                        PROCESS_CONFIG[
                                            key
                                        ]
                                    return (
                                        <span
                                            key={key}
                                            className="
                                                flex
                                                items-center
                                                gap-1
                                                rounded-full
                                                px-2.5
                                                py-1
                                                text-[11px]
                                                font-medium
                                                text-white
                                            "
                                            style={{backgroundColor:process.bgColor}}
                                        >
                                            {process.label}

                                            {selected.length >
                                                1 && (
                                                <span
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(
                                                        e
                                                    ) =>
                                                        removeProcess(
                                                            e,
                                                            key
                                                        )
                                                    }
                                                    className="rounded-full p-0.5 hover:bg-white/20"
                                                >
                                                    <X className="h-3 w-3" />
                                                </span>
                                            )}

                                        </span>
                                    )
                                }
                            )}

                        </div>


                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />

                    </Button>

                </PopoverTrigger>


                <PopoverContent
                    align="start"
                    className="w-[300px] p-2"
                >

                    <p className="px-2 pb-2 text-xs font-medium text-slate-500">
                        Seleccionar macroprocesos
                    </p>


                    <div className="space-y-1">

                        {PROCESS_OPTIONS.map(
                            (process) => {
                                const checked =
                                    selected.includes(
                                        process.key
                                    )

                                return (
                                    <button
                                        key={
                                            process.key
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleProcess(
                                                process.key
                                            )
                                        }
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-3
                                            rounded-md
                                            px-2
                                            py-2
                                            text-left
                                            text-sm
                                            transition
                                            hover:bg-slate-50
                                        "
                                    >

                                        <Checkbox
                                            checked={
                                                checked
                                            }
                                            onCheckedChange={() =>
                                                toggleProcess(
                                                    process.key
                                                )
                                            }
                                        />


                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    process.color,
                                            }}
                                        />


                                        <span className="flex-1">
                                            {
                                                process.label
                                            }
                                        </span>


                                        {checked && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}

                                    </button>
                                )
                            }
                        )}

                    </div>

                </PopoverContent>

            </Popover>

        </div>
    )
}

/* ============================================================
   KPI BASE
============================================================ */

function KpiCard({
    title,
    children,
    subtitle,
    icon: Icon,
    tone = "blue",
}) {
    const tones = {
        blue: {
            bg: "bg-blue-50",
            text: "text-blue-600",
        },

        green: {
            bg: "bg-emerald-50",
            text: "text-emerald-600",
        },

        purple: {
            bg: "bg-violet-50",
            text: "text-violet-600",
        },

        orange: {
            bg: "bg-orange-50",
            text: "text-orange-500",
        },
    }


    const style =
        tones[tone] ||
        tones.blue


    return (
        <Card className="shadow-sm gap-0 py-2">
            <CardContent className="flex min-h-[80px] items-center gap-4 p-4">
                <div
                    className={`
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${style.bg}
                        ${style.text}
                    `}
                >
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <p className="truncate uppercase text-sm font-medium text-slate-700">{title}</p>
                    <div className="mt-1">
                        {children}
                    </div>
                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}


/* ============================================================
   KPI REAL / PLANNED
============================================================ */

function ProcessKpi({
    title,
    real,
    planned,
    icon,
    tone,
}) {
    const percentage =
        planned > 0
            ? (real / planned) * 100
            : 0

    return (
        <KpiCard
            title={title}
            icon={icon}
            tone={tone}
            subtitle={`${percentage.toFixed(
                1
            )}%`}
        >
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-blue-600">
                    {formatNumber(real)}
                </span>
                <span className="text-xl text-slate-400">
                    /
                </span>
                <span className="text-xl font-medium text-slate-600">
                    {formatNumber(
                        planned
                    )}
                </span>
            </div>
        </KpiCard>
    )
}


/* ============================================================
   KPI META MES - PLANNED / REAL
============================================================ */

function MonthGoalKpi({
    title,
    planned,
    real,
    monthLabel,
    icon,
    tone,
}) {
    const percentage =
        planned > 0
            ? (real / planned) * 100
            : 0


    return (
        <KpiCard
            title={title}
            icon={icon}
            tone={tone}
        >
            <div className="flex items-baseline gap-1">
                {/* REAL */}
                <span className="text-2xl font-medium text-blue-600">
                    {formatNumber(real)}
                </span>
                <span className="text-xl text-slate-400">
                    /
                </span>
                {/* PLANNED */}
                <span className="text-xl font-semibold text-slate-800">
                    {formatNumber(
                        planned
                    )}
                </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
                {percentage.toFixed(1)}%
                {" · "}
                {monthLabel}
            </p>
        </KpiCard>
    )
}

/* ============================================================
   CURVA S
============================================================ */

function GeneralSCurve({
    data,
    selectedProcesses,
}) {
    return (
        <Card>
            <CardHeader className="pb-1 gap-0">
                <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                    Despliegue de Red
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[380px]">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <ComposedChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 25,
                                bottom: 10,
                                left: 5,
                            }}
                            barGap={0}
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="#fff"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={{
                                    stroke:
                                        "#CBD5E1",
                                }}
                                tick={{
                                    fontSize: 11,
                                    fill:
                                        "#64748B",
                                }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill:
                                        "#64748B",
                                }}
                            />
                            <Tooltip
                                formatter={(
                                    value,
                                    name
                                ) => [
                                    formatNumber(
                                        value
                                    ),
                                    name,
                                ]}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                height={6}
                                wrapperStyle={{
                                    fontSize: 11,
                                }}
                            />

                            {selectedProcesses.includes(
                                "ing"
                            ) && (
                                <>
                                    <Line
                                        type="monotone"
                                        dataKey="ingRealAccumDisplay"
                                        name="RFI Plan"
                                        stroke={PROCESS_CONFIG.ing.lineColor}
                                        strokeWidth={2.5}
                                        dot={false}
                                    >
                                        <LabelList
                                            dataKey="ingRealAccumDisplay"
                                            position="top"
                                            fontSize={11}
                                            fill={PROCESS_CONFIG.ing.textLineColor}
                                        />
                                    </Line>
                                </>
                            )}

                            {selectedProcesses.includes(
                                "rfi"
                            ) && (
                                <>
                                    <Bar
                                        dataKey="rfiRealAccumDisplay"
                                        name="RFI Real"
                                        fill={PROCESS_CONFIG.rfi.barColor}
                                        barSize={24}
                                        radius={[
                                            3,
                                            3,
                                            0,
                                            0,
                                        ]}
                                    >
                                        <LabelList
                                            dataKey="rfiRealAccumDisplay"
                                            position="center"
                                            fontSize={11}
                                            fill={PROCESS_CONFIG.rfi.color}
                                        />
                                    </Bar>
                                    <Line
                                        type="monotone"
                                        dataKey="rfiPlanAccumDisplay"
                                        name="RFI Plan"
                                        stroke={PROCESS_CONFIG.rfi.lineColor}
                                        strokeWidth={2.5}
                                        dot={{
                                            r: 0,
                                            fill:
                                                "#FFFFFF",
                                            stroke:
                                                PROCESS_CONFIG
                                                    .rfi
                                                    .color,
                                            strokeWidth:
                                                2,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="rfiPlanAccumDisplay"
                                            position="top"
                                            fontSize={11}
                                            fill={PROCESS_CONFIG.rfi.textLineColor}
                                        />
                                    </Line>
                                </>
                            )}

                            {selectedProcesses.includes("activados") && (
                                <>
                                    <Bar
                                        dataKey="activadosRealAccumDisplay"
                                        name="Activados - Real"
                                        fill={PROCESS_CONFIG.activados.barColor}
                                        barSize={24}
                                        radius={[
                                            3,
                                            3,
                                            0,
                                            0,
                                        ]}
                                    >
                                        <LabelList
                                            dataKey="activadosRealAccumDisplay"
                                            position="center"
                                            fontSize={11}
                                            fill={PROCESS_CONFIG.activados.color}
                                        />
                                    </Bar>
                                    <Line
                                        type="monotone"
                                        dataKey="activadosPlanAccumDisplay"
                                        name="Activados - Plan"
                                        stroke={PROCESS_CONFIG.activados.lineColor}
                                        strokeWidth={2.5}
                                        dot={{
                                            r: 0,
                                            fill:
                                                "#FFFFFF",
                                            stroke:
                                                PROCESS_CONFIG
                                                    .activados
                                                    .color,
                                            strokeWidth:
                                                2,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="activadosPlanAccumDisplay"
                                            position="top"
                                            fontSize={11}
                                            fill={PROCESS_CONFIG.activados.textLineColor}
                                        />
                                    </Line>
                                </>
                            )}


                            {selectedProcesses.includes("migrados") && (
                                <>
                                    <Bar
                                        dataKey="migradosRealAccumDisplay"
                                        name="Migrados - Real"
                                        fill={PROCESS_CONFIG.migrados.barColor}
                                        barSize={24}
                                        radius={[
                                            3,
                                            3,
                                            0,
                                            0,
                                        ]}
                                    >
                                        <LabelList
                                            dataKey="migradosRealAccumDisplay"
                                            position="insideBottom"
                                            fontSize={11}
                                            // fill={PROCESS_CONFIG.migrados.color}
                                            fill="#6b7280"
                                        />
                                    </Bar>
                                    <Line
                                        type="monotone"
                                        dataKey="activadosPlanAccumDisplay"
                                        name="Migrados - Plan"
                                        stroke={PROCESS_CONFIG.migrados.lineColor}
                                        strokeWidth={2.5}
                                        dot={{
                                            r: 0,
                                            fill:
                                                "#FFFFFF",
                                            stroke:
                                                PROCESS_CONFIG
                                                    .migrados
                                                    .color,
                                            strokeWidth:
                                                2,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="activadosPlanAccumDisplay"
                                            position="top"
                                            fontSize={11}
                                            fill={
                                                PROCESS_CONFIG.migrados.textLineColor
                                            }
                                        />
                                    </Line>
                                </>
                            )}

                        </ComposedChart>

                    </ResponsiveContainer>

                </div>

            </CardContent>

        </Card>
    )
}

/* ============================================================
   DISTRIBUCIÓN CLUSTER / ZONA
============================================================ */
function renderClusterCountLabel({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
}) {
    if (!value || percent < 0.06) {
        return null
    }

    const RADIAN = Math.PI / 180
    const radius =
        innerRadius +
        (outerRadius - innerRadius) * 0.55

    const x =
        cx +
        radius *
            Math.cos(
                -midAngle * RADIAN
            )

    const y =
        cy +
        radius *
            Math.sin(
                -midAngle * RADIAN
            )

    return (
        <text
            x={x}
            y={y}
            fill="#FFFFFF"
            textAnchor={
                x > cx ? "start" : "end"
            }
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
        >
            {value}
        </text>
    )
}


// function ClusterZoneCard({
//     clusterData,
//     zoneData,
//     total,
//     monthLabel,
//     mode,
//     onModeChange,
// }) {
//     const maxZone = Math.max(
//         ...zoneData.map(
//             (item) => item.value
//         ),
//         1
//     )

//     const titleSuffix =
//         mode === "accumulated"
//             ? `Acumulado a ${monthLabel}`
//             : `${monthLabel}`

//     const subtitle =
//         mode === "accumulated"
//             ? "Migrado acumulado"
//             : "Migrado del mes"

//     return (
//         <Card className="gap-0">
//             <CardHeader className="pb-2">
//                 <div className="flex items-start justify-between gap-3">
//                     <div>
//                         <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
//                             Distribución por Clúster
//                             {/* {titleSuffix} */}
//                         </CardTitle>

//                         <p className="mt-1 text-xs text-slate-400">
//                             {subtitle}
//                         </p>
//                     </div>

//                     <div className="flex rounded-lg border bg-white p-1">
//                         <button
//                             type="button"
//                             onClick={() =>
//                                 onModeChange(
//                                     "accumulated"
//                                 )
//                             }
//                             className={`rounded-md px-3 py-1 text-xs font-medium transition ${
//                                 mode ===
//                                 "accumulated"
//                                     ? "bg-blue-600 text-white"
//                                     : "text-slate-500 hover:bg-slate-50"
//                             }`}
//                         >
//                             Acumulado
//                         </button>

//                         <button
//                             type="button"
//                             onClick={() =>
//                                 onModeChange("month")
//                             }
//                             className={`rounded-md px-3 py-1 text-xs font-medium transition ${
//                                 mode === "month"
//                                     ? "bg-blue-600 text-white"
//                                     : "text-slate-500 hover:bg-slate-50"
//                             }`}
//                         >
//                             Mes
//                         </button>
//                     </div>
//                 </div>
//             </CardHeader>
//             <CardContent>
//                 <div className="grid items-center gap-2 lg:grid-cols-[170px_1fr]">
//                     <div className="relative h-[170px]">
//                         <ResponsiveContainer
//                             width="100%"
//                             height="100%"
//                         >
//                             <PieChart>
//                                 <Pie
//                                     data={clusterData}
//                                     dataKey="value"
//                                     nameKey="name"
//                                     innerRadius={48}
//                                     outerRadius={73}
//                                     stroke="#FFFFFF"
//                                     strokeWidth={2}
//                                     labelLine={false}
//                                     label={
//                                         renderClusterCountLabel
//                                     }
//                                 >
//                                     {clusterData.map(
//                                         (
//                                             item,
//                                             index
//                                         ) => (
//                                             <Cell
//                                                 key={
//                                                     item.name
//                                                 }
//                                                 fill={
//                                                     CLUSTER_COLORS[
//                                                         index %
//                                                             CLUSTER_COLORS.length
//                                                     ]
//                                                 }
//                                             />
//                                         )
//                                     )}
//                                 </Pie>

//                                 <Tooltip />
//                             </PieChart>
//                         </ResponsiveContainer>

//                         <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
//                             <span className="text-xl font-semibold text-slate-800">
//                                 {formatNumber(total)}
//                             </span>

//                             <span className="text-[10px] text-slate-400">
//                                 Migrados
//                             </span>
//                         </div>
//                     </div>

//                     <div className="space-y-2">
//                         {clusterData
//                             .slice(0, 6)
//                             .map(
//                                 (
//                                     item,
//                                     index
//                                 ) => {
//                                     const pct =
//                                         total
//                                             ? (
//                                                   item.value /
//                                                   total
//                                               ) * 100
//                                             : 0

//                                     return (
//                                         <div
//                                             key={
//                                                 item.name
//                                             }
//                                             className="flex items-center justify-between gap-3 text-xs"
//                                         >
//                                             <div className="flex items-center gap-2">
//                                                 <span
//                                                     className="h-2.5 w-2.5 rounded-full"
//                                                     style={{
//                                                         backgroundColor:
//                                                             CLUSTER_COLORS[
//                                                                 index %
//                                                                     CLUSTER_COLORS.length
//                                                             ],
//                                                     }}
//                                                 />
//                                                 <span className="text-slate-500">
//                                                     {/* Cluster{" "} */}
//                                                     {
//                                                         item.name
//                                                     }
//                                                 </span>
//                                             </div>

//                                             <span className="font-medium">
//                                                 {pct.toFixed(
//                                                     1
//                                                 )}
//                                                 % (
//                                                 {
//                                                     item.value
//                                                 }
//                                                 )
//                                             </span>
//                                         </div>
//                                     )
//                                 }
//                             )}
//                     </div>
//                 </div>

//                 <p className="mb-3 mt-4 text-xs font-semibold text-slate-600">
//                     Por Zona
//                 </p>

//                 <div className="space-y-3">
//                     {zoneData
//                         .slice(0, 5)
//                         .map(
//                             (
//                                 item,
//                                 index
//                             ) => {
//                                 const pct =
//                                     total
//                                         ? (
//                                               item.value /
//                                               total
//                                           ) * 100
//                                         : 0

//                                 return (
//                                     <div
//                                         key={
//                                             item.name
//                                         }
//                                         className="grid grid-cols-[60px_1fr_90px] items-center gap-2"
//                                     >
//                                         <span className="text-[11px] text-slate-500">
//                                             {
//                                                 item.name
//                                             }
//                                         </span>

//                                         <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
//                                             <div
//                                                 className="h-full rounded-full"
//                                                 style={{
//                                                     width: `${Math.max(
//                                                         3,
//                                                         (
//                                                             item.value /
//                                                             maxZone
//                                                         ) *
//                                                             100
//                                                     )}%`,
//                                                     backgroundColor:
//                                                         ZONE_COLORS[
//                                                             index %
//                                                                 ZONE_COLORS.length
//                                                         ],
//                                                 }}
//                                             />
//                                         </div>

//                                         <span className="text-right text-[11px] text-slate-600">
//                                             {formatNumber(
//                                                 item.value
//                                             )}{" "}
//                                             (
//                                             {pct.toFixed(
//                                                 1
//                                             )}
//                                             %)
//                                         </span>
//                                     </div>
//                                 )
//                             }
//                         )}
//                 </div>
//             </CardContent>
//         </Card>
//     )
// }

function ClusterZoneCard({
    clusterData,
    zoneData,
    totalClusterData,
    totalZoneData,
    // migratedTotal,
    totalIdentifiers,
    monthLabel,
    mode,
    onModeChange,
}) {
    const migratedTotal = useMemo(
        () => clusterData.reduce((acc, item) => acc + Number(item.value || 0), 0),
        [clusterData]
    )

    const totalClusterMap = useMemo(
        () => new Map(totalClusterData.map(item => [item.name, item.value])),
        [totalClusterData]
    )

    const totalZoneMap = useMemo(
        () => new Map(totalZoneData.map(item => [item.name, item.value])),
        [totalZoneData]
    )

    const maxZoneTotal = Math.max(...totalZoneData.map(item => item.value), 1)

    const totalPct = totalIdentifiers > 0
        ? (migratedTotal / totalIdentifiers) * 100
        : 0

    return (
        <Card className="h-full gap-0">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                            Distribución por Clúster
                        </CardTitle>

                        {/* <p className="mt-1 text-xs text-slate-400">{subtitle}</p> */}
                    </div>

                    <div className="flex rounded-lg border bg-white p-1">
                        <button
                            type="button"
                            onClick={() => onModeChange("accumulated")}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                                mode === "accumulated"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            Acumulado
                        </button>

                        <button
                            type="button"
                            onClick={() => onModeChange("month")}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                                mode === "month"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            Mes
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* =====================================================
                    CLUSTER
                ====================================================== */}

                <div className="grid items-center gap-4 lg:grid-cols-[170px_1fr]">
                    {/* DONA: DISTRIBUCIÓN DE MIGRADOS */}
                    <div className="relative h-[170px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clusterData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={48}
                                    outerRadius={73}
                                    stroke="#FFFFFF"
                                    strokeWidth={2}
                                    labelLine={false}
                                    label={renderClusterCountLabel}
                                >
                                    {clusterData.map((item, index) => (
                                        <Cell
                                            key={item.name}
                                            fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-semibold text-slate-800">
                                {formatNumber(migratedTotal)}
                            </span>
                            <span className="text-[10px] text-slate-400">Migrados</span>
                        </div>
                    </div>

                    {/* LEYENDA CLUSTER */}
                    <div>
                        <div className="mb-2 grid grid-cols-[1fr_58px_58px_62px] gap-2 text-[9px] font-semibold uppercase text-slate-400">
                            <span>Clúster</span>
                            <span className="text-right">Migr.</span>
                            <span className="text-right">Total</span>
                            <span className="text-right">Avance</span>
                        </div>

                        <div className="space-y-2.5">
                            {clusterData.slice(0, 6).map((item, index) => {
                                const clusterTotal = totalClusterMap.get(item.name) || 0
                                const pct = clusterTotal
                                    ? (item.value / clusterTotal) * 100
                                    : 0

                                return (
                                    <div
                                        key={item.name}
                                        className="grid grid-cols-[1fr_58px_58px_62px] items-center gap-2 text-xs"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        CLUSTER_COLORS[index % CLUSTER_COLORS.length],
                                                }}
                                            />
                                            <span className="truncate text-slate-500">
                                                {item.name}
                                            </span>
                                        </div>

                                        <span className="text-right font-semibold text-blue-600">
                                            {formatNumber(item.value)}
                                        </span>

                                        <span className="text-right font-medium text-slate-600">
                                            {formatNumber(clusterTotal)}
                                        </span>

                                        <span className="text-right font-semibold text-slate-700">
                                            {pct.toFixed(1)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* TOTAL CLUSTER */}
                        <div className="mt-3 grid grid-cols-[1fr_58px_58px_62px] gap-2 border-t pt-2 text-[11px] font-semibold">
                            <span>Total</span>

                            <span className="text-right text-blue-600">
                                {formatNumber(migratedTotal)}
                            </span>

                            <span className="text-right">
                                {formatNumber(totalIdentifiers)}
                            </span>

                            <span className="text-right">
                                {totalPct.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    ZONA
                ====================================================== */}

                <div className="mb-2 mt-5 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">Por Zona</p>

                    <div className="grid grid-cols-[52px_52px_62px] gap-2 text-[9px] font-semibold uppercase text-slate-400">
                        <span className="text-right">Migr.</span>
                        <span className="text-right">Total</span>
                        <span className="text-right">Avance</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {zoneData.slice(0, 6).map((item, index) => {
                        const zoneTotal = totalZoneMap.get(item.name) || 0
                        const pct = zoneTotal ? (item.value / zoneTotal) * 100 : 0

                        /*
                         * La barra gris representa el universo total de la zona.
                         * La barra coloreada representa los migrados dentro de ese total.
                         */
                        const totalWidth = (zoneTotal / maxZoneTotal) * 100
                        const migratedWidth = zoneTotal
                            ? (item.value / zoneTotal) * totalWidth
                            : 0

                        return (
                            <div
                                key={item.name}
                                className="grid grid-cols-[62px_minmax(100px,1fr)_52px_52px_62px] items-center gap-2"
                            >
                                <span className="truncate text-[11px] text-slate-500">
                                    {item.name}
                                </span>

                                <div className="relative h-2.5">
                                    {/* TOTAL DE LA ZONA */}
                                    <div
                                        className="absolute left-0 top-0 h-full rounded-full bg-slate-200"
                                        style={{ width: `${Math.max(3, totalWidth)}%` }}
                                    />

                                    {/* MIGRADOS DE LA ZONA */}
                                    <div
                                        className="absolute left-0 top-0 h-full rounded-full"
                                        style={{
                                            width: `${Math.max(item.value ? 3 : 0, migratedWidth)}%`,
                                            backgroundColor:
                                                ZONE_COLORS[index % ZONE_COLORS.length],
                                        }}
                                    />
                                </div>

                                <span className="text-right text-[11px] font-semibold text-blue-600">
                                    {formatNumber(item.value)}
                                </span>

                                <span className="text-right text-[11px] text-slate-600">
                                    {formatNumber(zoneTotal)}
                                </span>

                                <span className="text-right text-[11px] font-semibold text-slate-700">
                                    {pct.toFixed(1)}%
                                </span>
                            </div>
                        )
                    })}

                    {/* TOTAL ZONA */}
                    <div className="grid grid-cols-[62px_minmax(100px,1fr)_52px_52px_62px] items-center gap-2 border-t pt-2 text-[11px] font-semibold">
                        <span>Total</span>
                        <span />

                        <span className="text-right text-blue-600">
                            {formatNumber(migratedTotal)}
                        </span>

                        <span className="text-right">
                            {formatNumber(totalIdentifiers)}
                        </span>

                        <span className="text-right">
                            {totalPct.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


/* ============================================================
   P1
============================================================ */
const WEEKLY_DATA = [
    { week: "W23", monthGroup: "JUN", real: 110, evoP1: 198, plan: 110, rfcst: null },
    { week: "W24", monthGroup: "JUN", real: 110, evoP1: 200, plan: 110, rfcst: null },
    { week: "W25", monthGroup: "JUN", real: 125, evoP1: 228, plan: 125, rfcst: null },
    { week: "W26", monthGroup: "JUN", real: 145, evoP1: 263, plan: 145, rfcst: null },

    { week: "W27", monthGroup: "JUL", real: 156, evoP1: 263, plan: 150, rfcst: null },
    { week: "W28", monthGroup: "JUL", real: 160, evoP1: 283, plan: 155, rfcst: null },
    { week: "W29", monthGroup: "JUL", real: 171, evoP1: 327, plan: 165, rfcst: null },
    { week: "W30", monthGroup: "JUL", real: 176, evoP1: 367, plan: 170, rfcst: null },

    { week: "W31", monthGroup: "AGO", real: 221, evoP1: 397, plan: 200, rfcst: null },
    { week: "W32", monthGroup: "AGO", real: 238, evoP1: null, plan: 240, rfcst: 240 },
    { week: "W33", monthGroup: "AGO", real: null, evoP1: null, plan: null, rfcst: 253 },
    { week: "W34", monthGroup: "AGO", real: null, evoP1: null, plan: null, rfcst: 270 },
    { week: "W35", monthGroup: "AGO", real: null, evoP1: null, plan: null, rfcst: 285 },
    { week: "W36", monthGroup: "AGO", real: null, evoP1: null, plan: null, rfcst: 300 },

    { week: "W37", monthGroup: "SET", real: null, evoP1: null, plan: null, rfcst: 327 },
    { week: "W38", monthGroup: "SET", real: null, evoP1: null, plan: null, rfcst: 350 },
    { week: "W39", monthGroup: "SET", real: null, evoP1: null, plan: null, rfcst: 380 },
    { week: "W40", monthGroup: "SET", real: null, evoP1: null, plan: null, rfcst: 397 },
]

function buildMonthBands(data = []) {
    if (!data.length) return []

    const groups = []

    let currentMonth = data[0].monthGroup
    let startIndex = 0

    data.forEach((item, index) => {
        const monthChanged =
            item.monthGroup !== currentMonth

        if (monthChanged) {
            groups.push({
                month: currentMonth,
                start: startIndex,
                count: index - startIndex,
            })

            currentMonth = item.monthGroup
            startIndex = index
        }
    })

    groups.push({
        month: currentMonth,
        start: startIndex,
        count: data.length - startIndex,
    })

    return groups
}

function WeekMonthBands({ data }) {
    const groups = useMemo(
        () => buildMonthBands(data),
        [data]
    )

    return (
        <div
            /*
             * Estos paddings compensan aproximadamente
             * el espacio ocupado por YAxis y margen derecho
             * del ComposedChart.
             */
            className="pl-[50px] pr-[20px]"
        >
            <div
                className="grid"
                style={{
                    gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
                }}
            >
                {groups.map((group) => (
                    <div
                        key={`${group.month}-${group.start}`}
                        style={{
                            gridColumn: `${group.start + 1} / span ${group.count}`,
                        }}
                        className="
                            border-l
                            border-slate-200
                            text-center
                            first:border-l-0
                        "
                    >
                        <div className="border-t border-slate-200 pt-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {group.month}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function WeeklyDeploymentChart({
    data = WEEKLY_DATA,
}) {
    return (
        <Card className="h-[450px] overflow-hidden gap-0">
            <CardHeader className="pb-1">
                <CardTitle className="mb-4 text-lg font-semibold tracking-wide text-blue-500">
                    Sitios P1
                </CardTitle>
            </CardHeader>

            <CardContent className="flex h-[385px] flex-col px-4 pb-3">
                {/* GRÁFICA */}
                <div className="min-h-0 flex-1">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <ComposedChart
                            data={data}
                            margin={{
                                top: 18,
                                right: 20,
                                bottom: 5,
                                left: 0,
                            }}
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="#E2E8F0"
                            />

                            <XAxis
                                dataKey="week"
                                tickLine={false}
                                axisLine={{
                                    stroke: "#CBD5E1",
                                }}
                                tick={{
                                    fontSize: 10,
                                    fill: "#64748B",
                                }}
                            />

                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                domain={[0, 430]}
                                tick={{
                                    fontSize: 10,
                                    fill: "#64748B",
                                }}
                            />

                            <Tooltip />

                            <Bar
                                dataKey="real"
                                name="REAL"
                                fill="#4ADEC0"
                                barSize={16}
                                radius={[3, 3, 0, 0]}
                            >
                                <LabelList
                                    dataKey="real"
                                    position="insideBottom"
                                    fontSize={9}
                                    fill="#0F766E"
                                />
                            </Bar>

                            <Line
                                type="monotone"
                                dataKey="evoP1"
                                name="EvoP1"
                                stroke="#FB8C6C"
                                strokeWidth={2.5}
                                dot={false}
                            >
                                <LabelList
                                    dataKey="evoP1"
                                    position="top"
                                    fontSize={9}
                                    fill="#FB8C6C"
                                />
                            </Line>

                            <Line
                                type="monotone"
                                dataKey="plan"
                                name="PLAN"
                                stroke="#5B7CFA"
                                strokeWidth={2.5}
                                dot={false}
                            >
                                <LabelList
                                    dataKey="plan"
                                    position="top"
                                    fontSize={9}
                                    fill="#5B7CFA"
                                />
                            </Line>

                            <Line
                                type="monotone"
                                dataKey="rfcst"
                                name="RFCST"
                                stroke="#5B7CFA"
                                strokeWidth={2.5}
                                strokeDasharray="6 4"
                                dot={false}
                            >
                                <LabelList
                                    dataKey="rfcst"
                                    position="top"
                                    fontSize={9}
                                    fill="#5B7CFA"
                                />
                            </Line>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                {/* AGRUPACIÓN DE SEMANAS POR MES */}
                <div className="">
                    <WeekMonthBands data={data} />
                </div>

                {/* LEYENDA */}
                <div className="mt-2 flex justify-center gap-4 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#FB8C6C]">
                        <span className="h-[2px] w-5 bg-[#FB8C6C]" />
                        EvoP1
                    </div>

                    <div className="flex items-center gap-1.5 text-[#5B7CFA]">
                        <span className="h-[2px] w-5 bg-[#5B7CFA]" />
                        PLAN
                    </div>

                    <div className="flex items-center gap-1.5 text-[#0F766E]">
                        <span className="h-3 w-3 bg-[#4ADEC0]" />
                        REAL
                    </div>

                    <div className="flex items-center gap-1.5 text-[#5B7CFA]">
                        <span className="w-5 border-t-2 border-dashed border-[#5B7CFA]" />
                        RFCST
                    </div>
                </div>

                
            </CardContent>
        </Card>
    )
}











/* ============================================================
   CABLEADOS
============================================================ */
const MONTHLY_DATA = [
    { month: "Ene.", real: 67, plan: 67 },
    { month: "Feb.", real: 110, plan: 110 },
    { month: "Mar.", real: 160, plan: 160 },
    { month: "Abr.", real: 231, plan: 231 },
    { month: "May.", real: 302, plan: 287 },
    { month: "Jun.", real: 379, plan: 379 },
    { month: "Jul.", real: 450, plan: 450 },
    { month: "Ago.", real: 551, plan: 581 },
]

function MonthlyDeploymentChart({
    data = MONTHLY_DATA,
}) {
    return (
        <Card className="h-[430px] overflow-hidden gap-0">
            <CardHeader className="pb-1">
                <CardTitle className="mb-4 text-lg font-semibold tracking-wide text-blue-500">
                    Cableados y Balanceos
                </CardTitle>
            </CardHeader>

            <CardContent className="h-[365px] px-4 pb-4">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <ComposedChart
                        data={data}
                        margin={{
                            top: 18,
                            right: 18,
                            bottom: 8,
                            left: 0,
                        }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke="#fff"
                        />

                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={{
                                stroke: "#CBD5E1",
                            }}
                            tick={{
                                fontSize: 11,
                                fill: "#64748B",
                            }}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                            domain={[0, 620]}
                            tick={{
                                fontSize: 10,
                                fill: "#64748B",
                            }}
                        />

                        <Tooltip
                            formatter={(value, name) => [
                                formatNumber(value),
                                name,
                            ]}
                        />

                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                paddingTop: 16,
                                fontSize: 11,
                            }}
                        />

                        <Bar
                            dataKey="real"
                            name="REAL"
                            fill="#4ADEC0"
                            barSize={26}
                            radius={[3, 3, 0, 0]}
                        >
                            <LabelList
                                dataKey="real"
                                position="insideBottom"
                                fontSize={9}
                                fill="#0F766E"
                                formatter={formatNumber}
                            />
                        </Bar>

                        <Line
                            type="monotone"
                            dataKey="plan"
                            name="PLAN"
                            stroke="#5B7CFA"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 4 }}
                        >
                            <LabelList
                                dataKey="plan"
                                position="top"
                                fontSize={10}
                                fill="#737373"
                                formatter={formatNumber}
                            />
                        </Line>
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function WeeklyMonthlyDeploymentOverview({
    weeklyData = WEEKLY_DATA,
    monthlyData = MONTHLY_DATA,
}) {
    return (
        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-w-0">
                <WeeklyDeploymentChart data={weeklyData} />
            </div>

            <div className="min-w-0">
                <MonthlyDeploymentChart data={monthlyData} />
            </div>
        </div>
    )
}



function buildMigrationStatusMonthData(
    rows,
    currentDate
) {
    /*
     * META DEL MES
     *
     * activado_date_planned
     * solamente del mes actual.
     */
    const monthPlannedRows =
        rows.filter((row) =>
            isSameMonth(
                normalizeDashboardDate(
                    row.activado_date_planned
                ),
                currentDate
            )
        )

    /*
     * MIGRADOS DEL MES
     *
     * Dentro de esa meta mensual,
     * buscamos migrado_date_real
     * del mes actual.
     */
    const monthMigratedRows =
        monthPlannedRows.filter(
            (row) => {
                const real =
                    normalizeDashboardDate(
                        row.migrado_date_real
                    )

                return (
                    real &&
                    real <= currentDate &&
                    isSameMonth(
                        real,
                        currentDate
                    )
                )
            }
        )


    /*
     * Identificadores que ya migraron
     * este mes.
     */
    const migratedKeys =
        new Set(
            monthMigratedRows.map(
                (row) =>
                    row.identificador ??
                    row.id
            )
        )

    /*
     * LOS QUE QUEDAN PENDIENTES
     *
     * Son parte de la meta mensual,
     * pero no tienen migración real
     * durante el mes actual.
     */
    const pendingRows =
        monthPlannedRows.filter(
            (row) => {
                const key =
                    row.identificador ??
                    row.id

                return !migratedKeys.has(
                    key
                )
            }
        )


    /*
     * AGRUPAR PENDIENTES POR STATE
     */
    const stateMap =
        new Map()

    pendingRows.forEach((row) => {
        const state =
            row.state?.trim() ||
            "SIN ESTADO"

        stateMap.set(
            state,
            (stateMap.get(state) || 0) +
                1
        )
    })

    const statusData =
        [...stateMap.entries()]
            .map(
                ([state, value]) => ({
                    state,
                    value,
                })
            )
            .sort(
                (a, b) =>
                    b.value - a.value
            )

    const target =
        monthPlannedRows.length

    const migrated =
        monthMigratedRows.length

    const pending =
        pendingRows.length

    const percentage =
        target > 0
            ? (migrated / target) * 100
            : 0


    return {
        target,
        migrated,
        pending,
        percentage,

        statusData,

        monthPlannedRows,
        monthMigratedRows,
        pendingRows,
    }
}

const STATUS_COLORS = [
    "#2563EB",
    "#F59E0B",
    "#F97316",
    "#EC4899",
    "#94A3B8",
    "#8B5CF6",
    "#14B8A6",
]

function MigrationStatusMonthCard({
    rows,
    currentDate = new Date(),
}) {
    const data =
        useMemo(
            () =>
                buildMigrationStatusMonthData(
                    rows,
                    currentDate
                ),
            [
                rows,
                currentDate,
            ]
        )


    const monthLabel =
        new Intl.DateTimeFormat(
            "es-PE",
            {
                month: "long",
                year: "numeric",
            }
        ).format(currentDate)


    const maxStatus = Math.max(
        ...data.statusData.map(
            (item) => item.value
        ),
        1
    )


    return (
        <Card className="h-full w-[50%] gap-0">
            <CardHeader className="pb-3">
                <CardTitle className="mb-4 text-lg font-semibold tracking-wide text-blue-500">
                    Status - Meta Migrados
                </CardTitle>
                <p className="text-xs text-slate-400">
                    Meta mensual · {monthLabel}
                </p>
            </CardHeader>
            <CardContent>
                {/* =========================================
                    RESUMEN MIGRADOS
                ========================================== */}
                <div className="mb-5">
                    <div className="mb-2 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Migrados</p>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-2xl font-semibold text-emerald-600">
                                    {/* {formatNumber(
                                        data.migrated
                                    )} */}
                                    41
                                </span>
                                <span className="text-base text-slate-400">
                                    /
                                </span>
                                <span className="text-base font-medium text-slate-700">
                                    {formatNumber(
                                        data.target
                                    )}
                                </span>
                            </div>
                        </div>


                        <div className="text-right">

                            <span className="text-lg font-semibold text-slate-700">
                                {/* {data.percentage.toFixed(
                                    1
                                )} */}
                                57.7
                                %
                            </span>

                            <p className="text-[10px] text-slate-400">
                                de la meta
                            </p>

                        </div>

                    </div>


                    {/* BARRA GENERAL */}

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                        <div
                            className="h-full rounded-full bg-emerald-400 transition-all"
                            style={{
                                width: `${Math.min(
                                    100,
                                    data.percentage
                                )}%`,
                            }}
                        />

                    </div>

                </div>


                {/* =========================================
                    CABECERA STATUS
                ========================================== */}

                <div className="mb-3 flex items-center justify-between border-t pt-4">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pendientes por estado
                    </p>

                    <span className="text-xs font-semibold text-orange-500">
                        {/* {formatNumber(
                            data.pending
                        )}{" "} */}
                        30
                        pendientes
                    </span>

                </div>


                {/* =========================================
                    STATUS
                ========================================== */}

                <div className="space-y-3">

                    {data.statusData.map(
                        (
                            item,
                            index
                        ) => {
                            const color =
                                STATUS_COLORS[
                                    index %
                                        STATUS_COLORS.length
                                ]

                            const width = item.state === "VB RQ"
                                ? 0
                                : item.state === "ACTIVADO"
                                    ? 0
                                    : (item.value / maxStatus) * 100

                            const pctTarget =
                                data.target
                                    ? (
                                          item.value /
                                          data.target
                                      ) *
                                      100
                                    : 0


                            return (
                                <div
                                    key={
                                        item.state
                                    }
                                    className="grid grid-cols-[110px_1fr_55px] items-center gap-3"
                                >

                                    {/* STATE */}

                                    <span
                                        title={
                                            item.state
                                        }
                                        className="truncate text-xs font-medium text-slate-600"
                                    >
                                        {
                                            item.state
                                        }
                                    </span>


                                    {/* BARRA */}

                                    <div className="h-3 overflow-hidden rounded-sm bg-slate-100">

                                        <div
                                            className="h-full rounded-sm transition-all"
                                            style={{
                                                width: `${Math.max(
                                                    0,
                                                    width
                                                )}%`,

                                                backgroundColor:
                                                    color,
                                            }}
                                        />

                                    </div>


                                    {/* COUNT */}

                                    <div className="text-right">
                                        <span className="text-xs font-semibold text-slate-700">
                                            {/* {item.value} */}
                                            {item.state === "EN PROCESO" 
                                                ? 10
                                                : item.state === "VB RQ"
                                                    ? 0
                                                    : item.state === "ACTIVADO"
                                                        ? 0
                                                        : item.value
                                            }
                                        </span>
                                        <span className="ml-1 text-[9px] text-slate-400">
                                            {/* {pctTarget.toFixed(
                                                1
                                            )} */}
                                            {item.state === "VB RQ" 
                                                ? 0
                                                : item.state === "ACTIVADO"
                                                    ? 0
                                                    : pctTarget.toFixed(
                                                            1
                                                        )
                                            }
                                            %
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                    )}
                </div>
                {/* VACÍO */}
                {data.statusData.length ===
                    0 && (
                    <div className="py-8 text-center text-sm text-slate-400">
                        No existen pendientes para el mes.
                    </div>
                )}
            </CardContent>

        </Card>
    )
}


/* ============================================================
   MAPA
============================================================ */

function PeruGeneralMap({
    rows,
    departmentData,
    monthLabel,
    mode,
}) {
    const MAP_WIDTH = 520
    const MAP_HEIGHT = 500

    const departmentMap =
        useMemo(
            () =>
                new Map(
                    departmentData.map(
                        (item) => [
                            normalizeDepartment(
                                item.name
                            ),
                            item.value,
                        ]
                    )
                ),
            [departmentData]
        )

    const total =
        departmentData.reduce(
            (acc, item) =>
                acc + item.value,
            0
        )

    const maxValue = Math.max(
        ...departmentData.map(
            (item) => item.value
        ),
        1
    )

    const projection =
        useMemo(
            () =>
                geoMercator()
                    .fitExtent(
                        [
                            [25, 20],
                            [
                                MAP_WIDTH - 25,
                                MAP_HEIGHT - 20,
                            ],
                        ],
                        peruDepartments
                    ),
            []
        )

    const pathGenerator =
        useMemo(
            () =>
                geoPath(projection),
            [projection]
        )

    const markers =
        useMemo(
            () =>
                rows
                    .map((row) => {
                        const lat = Number(row.latitude)
                        const lng = Number(row.longitude)

                        if (
                            !Number.isFinite(
                                lat
                            ) ||
                            !Number.isFinite(
                                lng
                            )
                        ) {
                            return null
                        }

                        const point =
                            projection([
                                lng,
                                lat,
                            ])

                        if (!point) {
                            return null
                        }

                        return {
                            ...row,
                            x: point[0],
                            y: point[1],
                        }
                    })
                    .filter(Boolean),
            [rows, projection]
        )

    const typologyColumns =
        useMemo(() => {
            return [
                ...new Set(
                    rows
                        .map(
                            (row) =>
                                row.project_typology
                        )
                        .filter(Boolean)
                ),
            ].sort()
        }, [rows])

    const departmentTableData =
        useMemo(() => {
            const map = new Map()

            rows.forEach((row) => {
                const departamento =
                    row.departamento ||
                    "SIN INFORMACIÓN"

                if (
                    !map.has(
                        departamento
                    )
                ) {
                    map.set(
                        departamento,
                        {
                            name:
                                departamento,

                            migrated: 0,

                            metraje: 0,

                            typologies: {},
                        }
                    )
                }

                const current =
                    map.get(
                        departamento
                    )

                /*
                * Cada row representa
                * un migrado dentro del
                * dataset recibido.
                */
                current.migrated += 1

                /*
                * SUMA DE METRAJE
                */
                current.metraje +=
                    toNumber(
                        row.metraje
                    )

                /*
                * CONTEO POR TIPOLOGÍA
                */
                const typology =
                    row.project_typology ||
                    "SIN TIPOLOGÍA"

                current.typologies[
                    typology
                ] =
                    (
                        current.typologies[
                            typology
                        ] || 0
                    ) + 1
            })

            return [
                ...map.values(),
            ].sort(
                (a, b) =>
                    b.migrated -
                    a.migrated
            )
        }, [rows])
            

    const totalMigrated =
        departmentTableData.reduce(
            (acc, item) =>
                acc + item.migrated,
            0
        )


    const totalMetraje =
        departmentTableData.reduce(
            (acc, item) =>
                acc + item.metraje,
            0
        )


    const typologyTotals =
        useMemo(() => {
            const totals = {}

            typologyColumns.forEach(
                (typology) => {
                    totals[typology] = 0
                }
            )

            departmentTableData.forEach(
                (item) => {
                    typologyColumns.forEach(
                        (typology) => {
                            totals[
                                typology
                            ] +=
                                item
                                    .typologies[
                                    typology
                                ] || 0
                        }
                    )
                }
            )

            return totals
        }, [
            departmentTableData,
            typologyColumns,
        ])

    const title =
        mode === "accumulated"
            ? `Despliegue de Red - Acumulado a ${monthLabel}`
            : `Despliegue de Red - ${monthLabel}`

    const tableTitle =
        mode === "accumulated"
            ? `Activados por departamento (Acumulado a ${monthLabel})`
            : `Activados por departamento (${monthLabel})`

    return (
        <Card className="gap-0">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
                    <div className="flex h-[560px] min-w-0 flex-col xl:col-span-5">
                        <h3 className="mb-4 shrink-0 text-lg font-semibold tracking-wide text-blue-500">
                            {title}
                        </h3>
{/* min-h-[475px] h-[465px] */}
                        <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-slate-50">
                            <svg
                                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}

                                className="h-full w-full"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {peruDepartments?.features?.map((feature, index) => {
                                    const department = getGeoDepartmentName(feature)
                                    const value = departmentMap.get(normalizeDepartment(department)) || 0

                                    return (
                                        <path
                                            key={`${department}-${index}`}
                                            d={pathGenerator(feature) || ""}
                                            fill={getMapColor(value, maxValue)}
                                            stroke="#FFFFFF"
                                            strokeWidth={1.1}
                                        >
                                            <title>
                                                {department} - {value} Migrados
                                            </title>
                                        </path>
                                    )
                                })}

                                {markers.map((marker) => (
                                    <g
                                        key={marker.identificador ?? marker.id}
                                        transform={`translate(${marker.x}, ${marker.y})`}
                                    >
                                        <circle r={7} fill="#F97316" opacity={0.15} />
                                        <circle r={3.7} fill="#F97316" stroke="#FFFFFF" strokeWidth={1.4} />

                                        <title>
                                            {marker.identificador}
                                            {"\n"}
                                            {marker.site}
                                            {"\n"}
                                            {marker.departamento}
                                        </title>
                                    </g>
                                ))}
                            </svg>
                        </div>
                    </div>

                    <div className="flex h-[560px] min-w-0 flex-col xl:col-span-7">
                        <h3 className="mb-4 shrink-0 text-lg font-semibold tracking-wide text-blue-500">
                            {tableTitle}
                        </h3>

                        <div className="min-h-0 flex-1 overflow-auto rounded-xl border">
                            <div
                                className="grid min-w-max bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-600"
                                style={{
                                    gridTemplateColumns: `
                                        minmax(180px, 1fr)
                                        110px
                                        100px
                                        ${typologyColumns
                                            .map(
                                                () =>
                                                    "90px"
                                            )
                                            .join(" ")}
                                        90px
                                    `,
                                }}
                            >
                                <span>
                                    Departamento
                                </span>

                                <span className="text-right">
                                    Metraje
                                </span>

                                {typologyColumns.map(
                                    (typology) => (
                                        <span
                                            key={
                                                typology
                                            }
                                            className="text-right"
                                        >
                                            {typology}
                                        </span>
                                    )
                                )}

                                <span className="text-right">
                                    Migrados
                                </span>

                                <span className="text-right">
                                    % del total
                                </span>
                                
                            </div>


                            {departmentTableData.map(
                                (item) => {
                                    const pct =
                                        totalMigrated
                                            ? (
                                                item.migrated /
                                                totalMigrated
                                            ) * 100
                                            : 0

                                    return (
                                        <div
                                            key={
                                                item.name
                                            }
                                            className="grid min-w-max items-center border-t px-4 py-2.5 text-xs"
                                            style={{
                                                gridTemplateColumns: `
                                                    minmax(180px, 1fr)
                                                    110px
                                                    100px
                                                    ${typologyColumns
                                                        .map(
                                                            () =>
                                                                "90px"
                                                        )
                                                        .join(
                                                            " "
                                                        )}
                                                    90px
                                                `,
                                            }}
                                        >
                                            {/* DEPARTAMENTO */}

                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-orange-500" />

                                                <span>
                                                    {
                                                        item.name
                                                    }
                                                </span>
                                            </div>


                                            {/* METRAJE */}

                                            <span className="text-right font-medium">
                                                {formatNumber(
                                                    item.metraje
                                                )}
                                            </span>

                                            {/* TIPOLOGÍAS */}

                                            {typologyColumns.map(
                                                (
                                                    typology
                                                ) => (
                                                    <span
                                                        key={
                                                            typology
                                                        }
                                                        className="text-right text-slate-600"
                                                    >
                                                        {formatNumber(
                                                            item
                                                                .typologies[
                                                                typology
                                                            ] ||
                                                                0
                                                        )}
                                                    </span>
                                                )
                                            )}

                                            {/* TOTAL MIGRADOS */}

                                            <span className="text-right font-semibold">
                                                {formatNumber(
                                                    item.migrated
                                                )}
                                            </span>


                                            {/* % */}

                                            <span className="text-right text-slate-500">
                                                {pct.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                        </div>
                                    )
                                }
                            )}


                            {/* TOTAL GENERAL */}

                            <div
                                className="sticky top-0 z-50 grid min-w-max border-t bg-slate-50 px-4 py-3 text-xs font-semibold"
                                style={{
                                    gridTemplateColumns: `
                                        minmax(180px, 1fr)
                                        110px
                                        100px
                                        ${typologyColumns
                                            .map(
                                                () =>
                                                    "90px"
                                            )
                                            .join(" ")}
                                        90px
                                    `,
                                }}
                            >
                                <span>
                                    Total general
                                </span>

                                <span className="text-right">
                                    {formatNumber(
                                        totalMetraje
                                    )}
                                </span>

                                <span className="text-right">
                                    {formatNumber(
                                        totalMigrated
                                    )}
                                </span>

                                {typologyColumns.map(
                                    (typology) => (
                                        <span
                                            key={
                                                typology
                                            }
                                            className="text-right"
                                        >
                                            {formatNumber(
                                                typologyTotals[
                                                    typology
                                                ] || 0
                                            )}
                                        </span>
                                    )
                                )}

                                <span className="text-right">
                                    {totalMigrated
                                        ? "100.0%"
                                        : "0.0%"}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function buildDistributionBy(rows, field) {
    const map = new Map()

    rows.forEach(row => {
        const name = row[field]?.trim() || "OTRO"
        map.set(name, (map.get(name) || 0) + 1)
    })

    return [...map.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
}

export default function DashboardTx() {

    const currentDate = new Date()

    const [distributionMode, setDistributionMode] = useState("accumulated")

    const [selectedProcesses, setSelectedProcesses] = useState(["rfi", "migrados"])
    const [selectedProject, setSelectedProject] = useState("")
    const [selectedTypology, setSelectedTypology] = useState("")
    const [selectedGobernance, setSelectedGobernance] = useState("")
    const [searchSite, setSearchSite] = useState("")

    const rows =
        useMemo(
            () =>
                uniqueRows(data),
            [data]
        )


    /* ========================================================
       OPCIONES FILTRO
    ======================================================== */

    const projectOptions =
        useMemo(
            () =>
                [
                    ...new Set(
                        rows
                            .map(
                                (row) =>
                                    row.project_mac
                            )
                            .filter(Boolean)
                    ),
                ].sort(),

            [rows]
        )


    const typologyOptions =
        useMemo(
            () =>
                [
                    ...new Set(
                        rows
                            .map(
                                (row) =>
                                    row.project_typology
                            )
                            .filter(Boolean)
                    ),
                ].sort(),

            [rows]
        )

    const selectedGobernanceOptions = useMemo(
        () =>
            [
                ...new Set(
                    rows
                        .map(
                            (row) =>
                                row.gobernance
                        )
                        .filter(Boolean)
                ),
            ].sort(),
        [rows]
    )


    /* ========================================================
       FILTROS
    ======================================================== */

    const filteredRows =
        useMemo(() => {
            const search = normalizeText(searchSite)

            return rows.filter(
                (row) => {
                    const matchProject =
                        !selectedProject ||
                        row.project_mac ===
                            selectedProject


                    const matchTypology =
                        !selectedTypology ||
                        row.project_typology ===
                            selectedTypology

                    const matchGobernance =
                        !selectedGobernance ||
                        row.gobernance ===
                            selectedGobernance


                    /*
                     * Búsqueda por SITE.
                     *
                     * También dejo identificador
                     * porque suele ser útil como
                     * acceso rápido.
                     */
                    const matchSearch =
                        !search ||
                        normalizeText(
                            row.site
                        ).includes(
                            search
                        ) ||
                        normalizeText(
                            row.identificador
                        ).includes(
                            search
                        )


                    return (
                        matchProject &&
                        matchTypology &&
                        matchGobernance &&
                        matchSearch
                    )
                }
            )

        }, [
            rows,
            selectedProject,
            selectedTypology,
            selectedGobernance,
            searchSite,
        ])


    const currentYear =
        currentDate.getFullYear()


    const monthLabel =
        new Intl.DateTimeFormat(
            "es-PE",
            {
                month: "long",
                year: "numeric",
            }
        ).format(currentDate)


    const monthOnlyLabel =
        new Intl.DateTimeFormat(
            "es-PE",
            {
                month: "long",
            }
        ).format(currentDate)


    /* ========================================================
       KPIs
    ======================================================== */

    const metrics =
    useMemo(() => {
        const total =
            filteredRows.length

        /* ==========================================
           RFI GENERAL
           Real / Planned
        ========================================== */

        const rfiPlanned =
            filteredRows.filter(
                (row) => {
                    const date =
                        normalizeDashboardDate(
                            row.rfi_date_planned
                        )

                    return (
                        date &&
                        date.getFullYear() ===
                            currentYear
                    )
                }
            ).length

        const rfiReal =
            filteredRows.filter(
                (row) => {
                    const date =
                        normalizeDashboardDate(
                            row.rfi_date_real
                        )

                    return (
                        date &&
                        date.getFullYear() ===
                            currentYear &&
                        date <= currentDate
                    )
                }
            ).length

        /* ==========================================
           MIGRADOS GENERAL
           Real = migrado_date_real
           Planned = activado_date_planned
        ========================================== */

        const migratedPlanned =
            filteredRows.filter(
                (row) => {
                    const date =
                        normalizeDashboardDate(
                            row.activado_date_planned
                        )

                    return (
                        date &&
                        date.getFullYear() ===
                            currentYear
                    )
                }
            ).length

        const migratedReal =
            filteredRows.filter(
                (row) => {
                    const date =
                        normalizeDashboardDate(
                            row.migrado_date_real
                        )

                    return (
                        date &&
                        date.getFullYear() ===
                            currentYear &&
                        date <= currentDate
                    )
                }
            ).length

        /* ==========================================
           RFI META MES
           Acumulado al mes
           Planned = rfi_date_planned
           Real = rfi_date_real
        ========================================== */

        const rfiMonthPlanned =
            filteredRows.filter(
                (row) =>
                    isAccumulatedUntilMonth(
                        normalizeDashboardDate(
                            row.rfi_date_planned
                        ),
                        currentDate
                    )
            ).length

        const rfiMonthReal =
            filteredRows.filter(
                (row) => {
                    const real =
                        normalizeDashboardDate(
                            row.rfi_date_real
                        )

                    return (
                        real &&
                        real <= currentDate &&
                        isAccumulatedUntilMonth(
                            real,
                            currentDate
                        )
                    )
                }
            ).length

        /* ==========================================
           MIGRADOS META MES
           Acumulado al mes
           Planned = activado_date_planned
           Real = migrado_date_real
        ========================================== */

        const migratedMonthPlanned =
            filteredRows.filter(
                (row) =>
                    isAccumulatedUntilMonth(
                        normalizeDashboardDate(
                            row.activado_date_planned
                        ),
                        currentDate
                    )
            ).length

        const migratedMonthReal =
            filteredRows.filter(
                (row) => {
                    const real =
                        normalizeDashboardDate(
                            row.migrado_date_real
                        )

                    return (
                        real &&
                        real <= currentDate &&
                        isAccumulatedUntilMonth(
                            real,
                            currentDate
                        )
                    )
                }
            ).length

        /* ==========================================
           ACTIVADOS ACUMULADOS
           Para dona / zona / mapa
        ========================================== */

        const accumulatedActivatedRows =
            filteredRows.filter(
                (row) => {
                    const real =
                        normalizeDashboardDate(
                            row.migrado_date_real
                        )

                    return (
                        real &&
                        real.getFullYear() ===
                            currentYear &&
                        real <= currentDate
                    )
                }
            )

        /* ==========================================
           ACTIVADOS DEL MES
           Para dona / zona / mapa
        ========================================== */

        const monthActivatedRows =
            filteredRows.filter(
                (row) => {
                    const real =
                        normalizeDashboardDate(
                            row.activado_date_real
                        )

                    return (
                        real &&
                        real <= currentDate &&
                        isSameMonth(
                            real,
                            currentDate
                        )
                    )
                }
            )

        // Stand By
        const rfiStandBy = filteredRows.filter(r => r.state === "STAND BY").length

        return {
            total,

            rfiPlanned,
            rfiReal,

            migratedPlanned,
            migratedReal,

            rfiMonthPlanned,
            rfiMonthReal,

            migratedMonthPlanned,
            migratedMonthReal,

            accumulatedActivatedRows,
            monthActivatedRows,

            rfiStandBy,
        }
    }, [
        filteredRows,
        currentYear,
        currentDate,
    ])

    const activeDistributionRows = distributionMode === "accumulated"
        ? metrics.accumulatedActivatedRows
        : metrics.monthActivatedRows

    /* ========================================================
       CURVA S
    ======================================================== */

    const curveData =
        useMemo(
            () =>
                buildGeneralSCurve(
                    filteredRows,
                    currentYear,
                    currentDate
                ),

            [
                filteredRows,
                currentYear,
                currentDate,
            ]
        )


    /* ========================================================
       CLUSTER / ZONA / MAPA
    ======================================================== */

// const clusterData =
//     useMemo(
//         () =>
//             groupByCount(
//                 activeDistributionRows,
//                 "cluster"
//             ),
//         [activeDistributionRows]
//     )

// const zoneData =
//     useMemo(
//         () =>
//             groupByCount(
//                 activeDistributionRows,
//                 "zona"
//             ),
//         [activeDistributionRows]
//     )

const clusterData = useMemo(
    () => buildDistributionBy(activeDistributionRows, "cluster"),
    [activeDistributionRows]
)

const zoneData = useMemo(
    () => buildDistributionBy(activeDistributionRows, "zona"),
    [activeDistributionRows]
)

// Universo total, por ejemplo 1,232
const totalClusterData = useMemo(
    () => buildDistributionBy(filteredRows, "cluster"),
    [filteredRows]
)

const totalZoneData = useMemo(
    () => buildDistributionBy(filteredRows, "zona"),
    [filteredRows]
)

const totalIdentifiers = filteredRows.length

const departmentData =
    useMemo(
        () =>
            groupByCount(
                activeDistributionRows,
                "departamento"
            ),
        [activeDistributionRows]
    )

    return (
        <div className="grid grid-cols-12 gap-5 px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12 mt-14">

            {/* NAV TABS */}
            <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                    <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                        <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                            <div className="">
                                {/* router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff] */}
                                <Link aria-current="page" to="/projects/dashboard" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                        <Gauge /> General
                                    </div>
                                </Link>
                            </div>
                            <div className="">
                                <Link to="/projects/dashboard/process" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                        <Workflow /> Macroproceso
                                    </div>
                                </Link>
                            </div>
                        </div>  
                    </div>
                </div>
            </div>
            {/* Breadcrumb */}
            <div className="flex gap-4 w-[800px]">
                <a 
                    href="#" 
                    title="Atrás" 
                    className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                >
                    <ArrowLeft className="h-5 w-5" />
                </a>
                <h2 className="text-2xl font-semibold text-[#2b7fff]">Transporte</h2>
            </div>

            <div className="col-span-12 space-y-3">

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-12 space-y-3">
                        <Card className="shadow-sm overflow-hidden p-0 gap-0">
                            <CardHeader className="relative pt-3">
                                <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">Filtros Avanzados</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 mb-4">
                                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_1.8fr]">
                                    <SimpleSelect
                                        label="Macroproyecto"
                                        value={selectedProject}
                                        onChange={setSelectedProject}
                                        options={projectOptions}
                                        placeholder="Todos los proyectos"
                                    />
                                    <SimpleSelect
                                        label="Tipología"
                                        value={selectedTypology}
                                        onChange={setSelectedTypology}
                                        options={typologyOptions}
                                        placeholder="Todas las tipologías"
                                    />

                                    <SimpleSelect
                                        label="P1"
                                        value={selectedGobernance}
                                        onChange={setSelectedGobernance}
                                        options={selectedGobernanceOptions}
                                        placeholder="Todas las opciones"
                                    />

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-700">
                                            Búsqueda por sitio
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={
                                                    searchSite
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setSearchSite(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Sitio o identificador..."
                                                className="pl-9 pr-8"
                                            />
                                            {searchSite && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSearchSite(
                                                            ""
                                                        )
                                                    }
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}

                                        </div>

                                    </div>
                                    <MacroprocessMultiSelect
                                        selected={
                                            selectedProcesses
                                        }
                                        onChange={
                                            setSelectedProcesses
                                        }
                                    />
                                </div>
                            </CardContent>
                        
                        </Card>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">

                                {/* TOTAL */}
                                <KpiCard
                                    title="Total Liberados"
                                    icon={FileCheck2}
                                    tone="blue"
                                    subtitle=""
                                >
                                    <p className="text-2xl font-semibold text-blue-600">
                                        {formatNumber(
                                            metrics.total
                                        )}
                                    </p>
                                </KpiCard>

                                {/* MIGRADOS */}
                                <ProcessKpi
                                    title="Migrados"
                                    real={metrics.migratedReal}
                                    planned={metrics.migratedPlanned}
                                    icon={UploadCloud}
                                    tone="purple"
                                />

                                {/* META MIGRADOS */}
                                <MonthGoalKpi
                                    title="Migrados Meta Mes"
                                    real={metrics.migratedMonthReal}
                                    planned={metrics.migratedMonthPlanned}
                                    monthLabel={monthOnlyLabel}
                                    icon={Target}
                                    tone="purple"
                                />

                                {/* RFI */}
                                <ProcessKpi
                                    title="RFI"
                                    real={metrics.rfiReal}
                                    planned={metrics.rfiPlanned}
                                    icon={FileCheck2}
                                    tone="blue"
                                />

                                {/* META RFI */}
                                <MonthGoalKpi
                                    title="RFI Meta Mes"
                                    real={metrics.rfiMonthReal}
                                    planned={metrics.rfiMonthPlanned}
                                    monthLabel={monthOnlyLabel}
                                    icon={Target}
                                    tone="purple"
                                />

                                <KpiCard
                                    title="Issues RFI"
                                    icon={TriangleAlert}
                                    tone="orange"
                                    subtitle=""
                                >
                                    <p className="text-2xl font-semibold text-blue-600">
                                        {formatNumber(
                                            metrics.rfiStandBy
                                        )}
                                    </p>
                                </KpiCard>

                                

                            </div>


                            {/* =================================================
                                CURVA S + CLUSTER
                            ================================================= */}

                            <div className="grid gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(360px,.8fr)]">
                                <GeneralSCurve
                                    data={curveData}
                                    selectedProcesses={selectedProcesses}
                                />
                                {/* <ClusterZoneCard
                                    clusterData={clusterData}
                                    zoneData={zoneData}
                                    total={activeDistributionRows.length}
                                    monthLabel={monthLabel}
                                    mode={distributionMode}
                                    onModeChange={setDistributionMode}
                                /> */}
                                <ClusterZoneCard
                                    clusterData={clusterData}
                                    zoneData={zoneData}
                                    totalClusterData={totalClusterData}
                                    totalZoneData={totalZoneData}
                                    totalIdentifiers={filteredRows.length}
                                    monthLabel={monthLabel}
                                    mode={distributionMode}
                                    onModeChange={setDistributionMode}
                                />
                            </div>


                            {/* =================================================
                                MAPA + DEPARTAMENTOS
                            ================================================= */}

                            {/* <WeeklyMonthlyDeploymentOverview />

                            <MigrationStatusMonthCard
                                rows={filteredRows}
                                currentDate={currentDate}
                            /> */}

                            <PeruGeneralMap
                                rows={activeDistributionRows}
                                departmentData={departmentData}
                                monthLabel={monthLabel}
                                mode={distributionMode}
                            />
                    </div>
                </div>

            </div>

        </div>
    )
}