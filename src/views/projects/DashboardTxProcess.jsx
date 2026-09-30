import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    CheckCircle2,
    CircleDollarSign,
    CloudUpload,
    FileCheck2,
    MapPin,
    Search,
    Target,
    X,
    ArrowLeft,
    Workflow,
    Gauge,
    Settings,
    Layers3,
    Cog,
    ArrowDown,
    RadioTower,
    RefreshCcw,
    Wrench,
    Clock3,
    AlertTriangle,
    ReceiptText,
    WalletCards,
    Landmark,
    CircleCheckBig,
    Boxes
} from "lucide-react"
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

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import peruDepartments from "../../constants/peru_departamentos.json"
import { data } from "../../constants/tmp_data_sites_transporte.js"
import { Link } from "react-router";
// const peruDepartments = require("../../constants/peru_departamentos.json")

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

const MONTHS_INDEX = [
    { short: "Ene.", index: 0 },
    { short: "Feb.", index: 1 },
    { short: "Mar.", index: 2 },
    { short: "Abr.", index: 3 },
    { short: "May.", index: 4 },
    { short: "Jun.", index: 5 },
    { short: "Jul.", index: 6 },
    { short: "Ago.", index: 7 },
    { short: "Sep.", index: 8 },
    { short: "Oct.", index: 9 },
    { short: "Nov.", index: 10 },
    { short: "Dic.", index: 11 },
]

const PROCESS_DEFINITIONS = [
    {
        key: "ingenieria",
        label: "Ingeniería",
        plannedKey: "ing_date_planned",
        realKey: "ing_date_real",
        icon: Settings,
    },
    {
        key: "permisologia",
        label: "RFI",
        plannedKey: "rfi_date_planned",
        realKey: "rfi_date_real",
        icon: FileCheck2,
    },
    {
        key: "implementacion",
        label: "Implementación",
        plannedKey: "activado_date_planned",
        realKey: "activado_date_real",
        icon: Wrench,
    },
    {
        key: "migrados",
        label: "Migrados",
        plannedKey: "migrado_date_planned",
        realKey: "migrado_date_real",
        icon: CloudUpload,
    },
    {
        key: "entregables",
        label: "Entregables",
        plannedKey: "entregable_date_planned",
        realKey: "entregable_date_real",
        icon: CheckCircle2,
    },
    {
        key: "pagados",
        label: "Pagados",

        // Estos campos todavía no están
        // en el ejemplo del backend.
        plannedKey: "pago_date_planned",
        realKey: "pago_date_real",

        icon: CircleDollarSign,
    },
]

const STATUS_COLORS = [
    "#2563EB",
    "#60A5FA",
    "#14B8A6",
    "#F59E0B",
    "#F97316",
    "#8B5CF6",
    "#EC4899",
    "#94A3B8",
]

const CLUSTER_COLORS = [
    "#0B5CAD",
    "#2563EB",
    "#60A5FA",
    "#93C5FD",
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

// function getLastIndexWithData(
//     data,
//     monthlyKey
// ) {
//     let lastIndex = -1

//     for (
//         let i = 0;
//         i < data.length;
//         i++
//     ) {
//         const value =
//             Number(
//                 data[i]?.[monthlyKey] ||
//                 0
//             )

//         if (value > 0) {
//             lastIndex = i
//         }
//     }

//     return lastIndex
// }

function addAccumulatedDisplay(data, { monthlyKey, accumulatedKey, displayKey }) {
    let lastIndex = -1

    data.forEach((item, index) => {
        if (Number(item?.[monthlyKey] || 0) > 0) lastIndex = index
    })

    return data.map((item, index) => ({
        ...item,
        [displayKey]: index <= lastIndex ? item[accumulatedKey] : null,
    }))
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
        const value =
            row?.[field] ||
            "SIN INFORMACIÓN"

        map.set(
            value,
            (map.get(value) || 0) + 1
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

// function getMapColor(value) {
//     const count = Number(value || 0)

//     if (count === 0) return "#F1F5F9"

//     if (count <= 10) return "#DBEAFE"

//     if (count <= 30) return "#BFDBFE"

//     if (count <= 60) return "#93C5FD"

//     if (count <= 100) return "#60A5FA"

//     if (count <= 200) return "#2563EB"

//     return "#1E3A8A"
// }


function formatNumber(value) {
    return Number(
        value || 0
    ).toLocaleString("en-US")
}

function buildSCurve(rows, year, currentDate) {
    const series = MONTHS.map((month, monthIndex) => ({
        month,
        monthIndex,

        ingMonthlyReal: 0,
        rfiMonthlyPlanned: 0,
        rfiMonthlyReal: 0,
        planMonthly: 0,
        realMonthly: 0,

        ingRealAccum: 0,
        rfiFcstAccum: 0,
        rfirealAccum: 0,
        planAccum: 0,
        realAccum: 0,

        ingRealAccumDisplay: null,
        rfiFcstAccumDisplay: null,
        rfiRealAccumDisplay: null,
        planAccumDisplay: null,
        realAccumDisplay: null,

        realMigAccumDisplay: null
    }))

    rows.forEach((row) => {
        const ingReal = normalizeDashboardDate(row.ing_date_real)
        const rfiPlanned = normalizeDashboardDate(row.rfi_date_planned)
        const rfiReal = normalizeDashboardDate(row.rfi_date_real)
        const planned = normalizeDashboardDate(row.activado_date_planned)
        const real = normalizeDashboardDate(row.activado_date_real)

        // INGENIERÍA REAL
        if (ingReal && ingReal.getFullYear() === year && ingReal <= currentDate) {
            series[ingReal.getMonth()].ingMonthlyReal += 1
        }

        // RFI PLAN
        if (rfiPlanned && rfiPlanned.getFullYear() === year) {
            series[rfiPlanned.getMonth()].rfiMonthlyPlanned += 1
        }

        // RFI REAL
        if (rfiReal && rfiReal.getFullYear() === year && rfiReal <= currentDate) {
            series[rfiReal.getMonth()].rfiMonthlyReal += 1
        }

        // IMPLEMENTACIÓN PLAN
        if (planned && planned.getFullYear() === year) {
            series[planned.getMonth()].planMonthly += 1
        }

        // IMPLEMENTACIÓN REAL
        if (real && real.getFullYear() === year && real <= currentDate) {
            series[real.getMonth()].realMonthly += 1
        }
    })

    // Último mes con información real en cada serie
    const lastIngRealIndex = getLastIndexWithData(series, "ingMonthlyReal")
    const lastRfiPlanIndex = getLastIndexWithData(series, "rfiMonthlyPlanned")
    const lastRfiRealIndex = getLastIndexWithData(series, "rfiMonthlyReal")
    const lastPlanIndex = getLastIndexWithData(series, "planMonthly")
    const lastRealIndex = getLastIndexWithData(series, "realMonthly")

    let ingRealAccum = 0
    let rfiFcstAccum = 0
    let rfirealAccum = 0
    let planAccum = 0
    let realAccum = 0

    return series.map((item, index) => {
        ingRealAccum += item.ingMonthlyReal
        rfiFcstAccum += item.rfiMonthlyPlanned
        rfirealAccum += item.rfiMonthlyReal
        planAccum += item.planMonthly
        realAccum += item.realMonthly

        return {
            ...item,

            ingRealAccum,
            rfiFcstAccum,
            rfirealAccum,
            planAccum,
            realAccum,

            ingRealAccumDisplay: index <= lastIngRealIndex ? ingRealAccum : null,
            rfiFcstAccumDisplay: index <= lastRfiPlanIndex ? rfiFcstAccum : null,
            rfiRealAccumDisplay: index <= lastRfiRealIndex ? rfirealAccum : null,
            planAccumDisplay: index <= lastPlanIndex ? planAccum : null,
            realMigAccumDisplay: index <= lastRealIndex ? realAccum : null,
            realAccumDisplay: index <= lastRealIndex ? realAccum + 80 : null,
        }
    })
}

function getLastIndexWithData(data, monthlyKey) {
    let lastIndex = -1

    data.forEach((item, index) => {
        if (Number(item?.[monthlyKey] || 0) > 0) lastIndex = index
    })

    return lastIndex
}

function buildProviderMigrationData(rows, currentDate, mode = "accumulated") {
    const providerMap = new Map()

    const isInScope = (date) => {
        if (!date) return false

        return mode === "accumulated"
            ? isAccumulatedUntilMonth(date, currentDate)
            : isSameMonth(date, currentDate)
    }

    rows.forEach((row) => {
        const provider = row.proveedor?.trim() || "SIN PROVEEDOR"

        const rfiDate = normalizeDashboardDate(row.rfi_date_real)
        const migratedDate = normalizeDashboardDate(row.migrado_date_real)
        const plannedDate = normalizeDashboardDate(row.activado_date_planned)

        const rfiInScope = rfiDate && rfiDate <= currentDate && isInScope(rfiDate)
        const migratedInScope = migratedDate && migratedDate <= currentDate && isInScope(migratedDate)
        const plannedInScope = isInScope(plannedDate)

        if (!rfiInScope && !migratedInScope && !plannedInScope) return

        if (!providerMap.has(provider)) {
            providerMap.set(provider, {
                provider,
                rfi: 0,
                migrated: 0,
                pending: 0,
                total: 0,
            })
        }

        const current = providerMap.get(provider)

        if (rfiInScope) current.rfi += 1
        if (migratedInScope) current.migrated += 1
        if (plannedInScope && !migratedInScope) current.pending += 1

        // RFI NO entra aquí.
        current.total = current.migrated + current.pending
    })

    return [...providerMap.values()].sort((a, b) => b.peding - a.pending)
}


/* ============================================================
   FILTRO MULTIPLE TYPOLOGY
============================================================ */

function TypologyMultiSelect({
    options,
    selected,
    onChange,
}) {
    function toggle(value) {
        if (selected.includes(value)) {
            onChange(
                selected.filter(
                    (item) =>
                        item !== value
                )
            )

            return
        }

        onChange([
            ...selected,
            value,
        ])
    }


    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-slate-600">
                Tipología
            </span>
            <Button
                type="button"
                size="sm"
                variant={
                    selected.length === 0
                        ? "default"
                        : "outline"
                }
                className="h-8 rounded-full px-4"
                onClick={() =>
                    onChange([])
                }
            >
                Todas
            </Button>


            {options.map((option) => {
                const active =
                    selected.includes(
                        option
                    )
                return (
                    <Button
                        key={option}
                        type="button"
                        size="sm"
                        variant={
                            active
                                ? "default"
                                : "outline"
                        }
                        className="h-8 rounded-full px-4"
                        onClick={() =>
                            toggle(option)
                        }
                    >
                        {option}
                    </Button>
                )
            })}
        </div>
    )
}

/* ============================================================
   SELECT SIMPLE
============================================================ */
function SimpleSelect({
    value,
    onChange,
    options,
    allLabel,
}) {
    return (
        <select
            value={value}
            onChange={(e) =>
                onChange(
                    e.target.value
                )
            }
            className="
                h-9
                min-w-[180px]
                rounded-md
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
                {allLabel}
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
    )
}

/* ============================================================
   KPI
============================================================ */
function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    tone = "blue",
}) {
    const tones = {
        blue: {
            box: "bg-blue-50",
            icon: "text-blue-600",
        },

        green: {
            box: "bg-emerald-50",
            icon: "text-emerald-600",
        },

        orange: {
            box: "bg-orange-50",
            icon: "text-orange-500",
        },

        purple: {
            box: "bg-violet-50",
            icon: "text-violet-600",
        },
    }

    const style = tones[tone] || tones.blue

    return (
        <Card className="shadow-sm gap-0 py-2">
            <CardContent className="flex h-full items-center gap-4 p-4">
                <div
                    className={`
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${style.box}
                        ${style.icon}
                    `}
                >
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <p className="truncate uppercase text-sm font-medium text-slate-700">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                        {value}
                    </p>
                    <p className="mt-2 truncate text-xs text-slate-400">
                        {subtitle}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

/* ============================================================
   TIMELINE MACROPROCESOS
============================================================ */
function MacroprocessTimeline({
    rows,
    selected,
    onSelect,
}) {
    const stages =
        useMemo(() => {
            return PROCESS_DEFINITIONS.map(
                (stage) => {
                    const planned =
                        rows.filter(
                            (row) =>
                                normalizeDashboardDate(
                                    row[
                                        stage.plannedKey
                                    ]
                                )
                        ).length


                    const real =
                        rows.filter(
                            (row) =>
                                normalizeDashboardDate(
                                    row[
                                        stage.realKey
                                    ]
                                )
                        ).length


                    const percentage =
                        planned > 0
                            ? Math.min(
                                100,
                                Math.round(
                                    (
                                        real /
                                        planned
                                    ) * 100
                                )
                            )
                            : null


                    return {
                        ...stage,
                        planned,
                        real,
                        percentage,
                    }
                }
            )
        }, [rows])

    return (
        <Card className="h-fit lg:sticky lg:top-4">
            <CardContent className="p-3">
                <div className="relative">
                    <div
                        className="
                            absolute
                            bottom-12
                            left-[27px]
                            top-10
                            border-l
                            border-dashed
                            border-blue-200
                        "
                    />
                    <div className="space-y-3">
                        {stages.map(
                            (
                                stage,
                                index
                            ) => {
                                const Icon =
                                    stage.icon

                                const isSelected =
                                    selected ===
                                    stage.key


                                return (
                                    <button
                                        key={
                                            stage.key
                                        }
                                        type="button"
                                        onClick={() =>
                                            onSelect(
                                                stage.key
                                            )
                                        }
                                        className={`
                                            relative
                                            z-10
                                            flex
                                            w-full
                                            items-center
                                            gap-3
                                            rounded-xl
                                            border
                                            p-3
                                            text-left
                                            transition-all

                                            ${
                                                isSelected
                                                    ? `
                                                        border-emerald-500
                                                        bg-emerald-50/50
                                                        shadow-sm
                                                    `
                                                    : `
                                                        border-transparent
                                                        bg-white
                                                        hover:border-slate-200
                                                        hover:bg-slate-50
                                                    `
                                            }
                                        `}
                                    >
                                        <div
                                            className={`
                                                flex
                                                h-7
                                                w-7
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                text-xs
                                                font-semibold
                                                text-white

                                                ${
                                                    isSelected
                                                        ? "bg-emerald-500"
                                                        : "bg-blue-600"
                                                }
                                            `}
                                        >
                                            {index + 1}
                                        </div>
                                        <div
                                            className={`
                                                flex
                                                h-11
                                                w-11
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full

                                                ${
                                                    isSelected
                                                        ? "bg-emerald-100 text-emerald-600"
                                                        : "bg-blue-50 text-blue-600"
                                                }
                                            `}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {stage.label}
                                            </p>
                                            <p
                                                className={`
                                                    mt-0.5
                                                    text-[11px]

                                                    ${
                                                        isSelected
                                                            ? "font-medium text-emerald-600"
                                                            : "text-slate-400"
                                                    }
                                                `}
                                            >
                                                {isSelected
                                                    ? "En progreso"
                                                    : "Avance general"}
                                            </p>
                                            {/* <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                                {stage.percentage !==
                                                null
                                                    ? `${stage.percentage}%`
                                                    : "—"}
                                            </p> */}
                                        </div>
                                        {isSelected && (
                                            <div
                                                className="
                                                    absolute
                                                    -right-[7px]
                                                    h-3
                                                    w-3
                                                    rotate-45
                                                    border-r
                                                    border-t
                                                    border-emerald-500
                                                    bg-emerald-50
                                                "
                                            />
                                        )}
                                    </button>
                                )
                            }
                        )}
                    </div>
                </div>
                <div className="mt-5 border-t pt-3 text-xs text-slate-400">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-400" />
                    Etapas del macroproceso
                </div>
            </CardContent>
        </Card>
    )
}

/* ============================================================
   CLUSTER + ZONA
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
    // if (!value || percent < 0.06) {
    //     return null
    // }

    const RADIAN = Math.PI / 180
    // const radius =
    //     innerRadius +
    //     (outerRadius - innerRadius) * 0.55

    const radius =
        innerRadius +
        (outerRadius - innerRadius) * 0.32

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

function buildEngineeringCurveData(
    rows,
    dashboardYear = DASHBOARD_YEAR
) {
    /*
     * Estructura:
     * 0  -> bucket "2025"
     * 1  -> Ene.
     * 2  -> Feb.
     * ...
     * 12 -> Dic.
     */
    const base = [
        {
            key: "preYear",
            label: String(
                dashboardYear - 1
            ),
            monthly: 0,
            accumulated: 0,
        },

        ...MONTHS.map(
            (monthLabel, monthIndex) => ({
                key: `m-${monthIndex}`,
                label: monthLabel,
                monthIndex,
                monthly: 0,
                accumulated: 0,
            })
        ),
    ]

    rows.forEach((row) => {
        const date = parseDMY(
            row.ing_date_real
        )

        if (!date) return

        const year =
            date.getFullYear()

        /*
         * Todo lo previo al año dashboard
         * se consolida en el bucket "2025".
         */
        if (year < dashboardYear) {
            base[0].monthly += 1
            return
        }

        if (year === dashboardYear) {
            const month =
                date.getMonth()

            base[month + 1].monthly += 1
        }
    })

    // let acc = 0

    // return base.map((item) => {
    //     acc += item.monthly

    //     return {
    //         ...item,
    //         accumulated: acc,
    //     }
    // })

    let acc = 0

    const accumulatedData =
        base.map((item) => {
            acc += item.monthly

            return {
                ...item,
                accumulated: acc,
            }
        })


    return addAccumulatedDisplay(
        accumulatedData,
        {
            monthlyKey:
                "monthly",

            accumulatedKey:
                "accumulated",

            displayKey:
                "accumulatedDisplay",
        }
    )
}

function buildEntregablesCurveData(
    rows,
    currentDate = new Date(),
    dashboardYear = 2026
) {
    const currentMonthIndex =
        currentDate.getMonth()

    const base = MONTHS_INDEX.map((month) => ({
        month: month.short,

        migradosMonthly: 0,
        migradosAccum: 0,

        entregablesPlanMonthly: 0,
        entregablesPlanAccum: 0,

        entregablesPlanBarDisplay: null,
        entregablesPlanFutureDisplay: null,
    }))

    rows.forEach((row) => {
        const migradoReal = normalizeDashboardDate(
            row.migrado_date_real,
            dashboardYear
        )

        if (
            migradoReal &&
            migradoReal.getFullYear() === dashboardYear
        ) {
            const monthIndex =
                migradoReal.getMonth()
            base[monthIndex].migradosMonthly += 1
        }

        const entregablePlanned =
            normalizeDashboardDate(
                row.entregable_date_planned,
                dashboardYear
            )

        if (
            entregablePlanned &&
            entregablePlanned.getFullYear() === dashboardYear
        ) {
            const monthIndex =
                entregablePlanned.getMonth()
            base[monthIndex].entregablesPlanMonthly += 1
        }
    })

    let migradoAcc = 0
    let entregableAcc = 0

    const accumulated = base.map(
        (item, index) => {
            migradoAcc += item.migradosMonthly
            entregableAcc +=
                item.entregablesPlanMonthly

            return {
                ...item,
                migradosAccum: migradoAcc,
                entregablesPlanAccum:
                    entregableAcc,

                // barra solo hasta mes actual
                entregablesPlanBarDisplay:
                    index <= currentMonthIndex
                        ? entregableAcc
                        : null,

                // línea punteada para futuro
                entregablesPlanFutureDisplay:
                    index >= currentMonthIndex
                        ? entregableAcc
                        : null,
            }
        }
    )

    return addAccumulatedDisplay(
        accumulated,
        {
            monthlyKey: "migradosMonthly",
            accumulatedKey: "migradosAccum",
            displayKey:
                "migradosAccumDisplay",
        }
    )
}

function buildEntregablesStatusData(
    rows,
    currentDate = new Date(),
    dashboardYear = 2026
) {
    const currentMonthIndex =
        currentDate.getMonth()

    const validRows = rows.filter((row) => {
        const planned =
            normalizeDashboardDate(
                row.entregable_date_planned,
                dashboardYear
            )

        if (!planned) return false
        if (
            planned.getFullYear() !==
            dashboardYear
        )
            return false

        return (
            planned.getMonth() <=
            currentMonthIndex
        )
    })

    const statusMap = new Map()

    validRows.forEach((row) => {
        const status =
            row.entregable_status?.trim() ||
            "SIN ESTADO"

        statusMap.set(
            status,
            (statusMap.get(status) || 0) + 1
        )
    })

    const total = validRows.length

    const data = [...statusMap.entries()]
        .map(([name, value], index) => ({
            name,
            value,
            percentage: total
                ? (value / total) * 100
                : 0,
            color:
                STATUS_COLORS[
                    index % STATUS_COLORS.length
                ],
        }))
        .sort((a, b) => b.value - a.value)

    return {
        total,
        data,
    }
}

function EntregablesCurveChart({
    data,
}) {
    return (
        <Card className="flex h-full flex-col gap-0">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                    Despliegue - Entregables
                </CardTitle>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-[330px] flex-1">
                    <ResponsiveContainer
                        // gap={0}
                        width="100%"
                        height="100%"
                    >
                        <ComposedChart
                            data={data}
                            barGap={0}
                            margin={{
                                top: 25,
                                right: 25,
                                bottom: 5,
                                left: 0,
                            }}
                        >
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="#ffffff"
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
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#64748B",
                                }}
                            />

                            <Tooltip
                                formatter={(
                                    value,
                                    name
                                ) => [
                                    formatNumber(value),
                                    name,
                                ]}
                            />

                            {/* MIGRADOS ACUM */}
                            <Bar
                                dataKey="migradosAccumDisplay"
                                name="Migrados acumulado"
                                fill="#34D399"
                                barSize={20}
                                radius={[4, 4, 0, 0]}
                            >
                                <LabelList
                                    dataKey="migradosAccumDisplay"
                                    position="top"
                                    fill="#065F46"
                                    fontSize={10}
                                />
                            </Bar>

                            {/* ENTREGABLES ACUM HASTA HOY */}
                            <Bar
                                dataKey="entregablesPlanBarDisplay"
                                name="Entregables acumulado"
                                fill="#60A5FA"
                                barSize={20}
                                radius={[4, 4, 0, 0]}
                            >
                                <LabelList
                                    dataKey="entregablesPlanBarDisplay"
                                    position="insideBottom"
                                    fill="#1D4ED8"
                                    fontSize={10}
                                />
                            </Bar>

                            {/* FUTURO EN PUNTEADO */}
                            <Line
                                type="monotone"
                                dataKey="entregablesPlanFutureDisplay"
                                name="Entregables planificados"
                                stroke="#60A5FA"
                                strokeWidth={2.5}
                                strokeDasharray="6 4"
                                dot={false}
                                activeDot={{ r: 3 }}
                            >
                                <LabelList
                                    dataKey="entregablesPlanFutureDisplay"
                                    position="top"
                                    fill="#2563EB"
                                    fontSize={10}
                                />
                            </Line>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-2 flex shrink-0 justify-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 bg-[#34D399]" />
                        Migrados acum.
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 bg-[#60A5FA]" />
                        Entregables acum.
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="w-6 border-t-2 border-dashed border-[#60A5FA]" />
                        Entregables FCST
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function renderPieLabel({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    value,
}) {
    /*
     * Lo colocamos exactamente hacia
     * el centro del espesor del anillo.
     *
     * textAnchor="middle" evita que
     * números como 237 se salgan.
     */
    const RADIAN = Math.PI / 180

    const radius =
        innerRadius +
        (outerRadius - innerRadius) * 0.52

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

    /*
     * Si algún segmento termina siendo
     * extremadamente pequeño, ocultamos
     * solamente el número interior.
     *
     * Igual seguirá apareciendo al costado.
     */
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

function EntregablesStatusDonut({
    total,
    data,
    monthLabel,
}) {
    return (
        <Card className="flex h-full flex-col gap-0">

            <CardHeader className="pb-1">
                <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                    Distribución por Estado
                </CardTitle>

                <p className="text-sm text-slate-400">
                    Entregables planificados acumulados a{" "}
                    {monthLabel}
                </p>
            </CardHeader>


            <CardContent className="flex min-h-0 flex-1 flex-col">

                {/* ==============================
                    DONA
                =============================== */}

                <div className="relative mx-auto h-[240px] w-[260px]">

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={62}
                                outerRadius={92}
                                paddingAngle={1}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                                labelLine={false}
                                label={renderPieLabel}
                            >
                                {data.map((item) => (
                                    <Cell
                                        key={item.name}
                                        fill={item.color}
                                    />
                                ))}
                            </Pie>

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
                        </PieChart>
                    </ResponsiveContainer>


                    {/* CENTRO DONA */}

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                        <span className="text-[28px] font-semibold leading-none text-slate-900">
                            {formatNumber(total)}
                        </span>

                        <span className="mt-1 text-xs text-slate-400">
                            Entregables
                        </span>

                    </div>

                </div>


                {/* ==============================
                    LEYENDA DEBAJO
                =============================== */}

                <div className="mx-auto mt-1 w-full max-w-[360px] space-y-2">

                    {data.map((item) => (
                        <div
                            key={item.name}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
                        >

                            {/* ESTADO */}

                            <div className="flex min-w-0 items-center gap-2">

                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor:
                                            item.color,
                                    }}
                                />

                                <span
                                    title={item.name}
                                    className="truncate text-sm text-slate-600"
                                >
                                    {item.name}
                                </span>

                            </div>


                            {/* % + CANTIDAD */}

                            <span className="whitespace-nowrap text-sm font-semibold text-slate-800">

                                {item.percentage.toFixed(
                                    1
                                )}
                                %

                                <span className="ml-1">
                                    (
                                    {formatNumber(
                                        item.value
                                    )}
                                    )
                                </span>

                            </span>

                        </div>
                    ))}

                </div>

            </CardContent>

        </Card>
    )
}

function buildProviderDeliverablesData(
    rows,
    currentDate,
    dashboardYear = 2026
) {
    /*
     * Estados disponibles en todo el universo filtrado.
     */
    const statusColumns = [
        ...new Set(
            rows
                .map((row) =>
                    row.entregable_status?.trim()
                )
                .filter(Boolean)
        ),
    ].sort()

    const providerMap = new Map()

    rows.forEach((row) => {
        const planned =
            normalizeDashboardDate(
                row.entregable_date_planned,
                dashboardYear
            )

        if (!planned) return

        if (
            planned.getFullYear() !==
            dashboardYear
        ) {
            return
        }

        const provider =
            row.proveedor?.trim() ||
            "SIN PROVEEDOR"

        if (!providerMap.has(provider)) {
            const statuses = {}

            statusColumns.forEach((status) => {
                statuses[status] = 0
            })

            providerMap.set(provider, {
                provider,
                totalDeliverables: 0,
                deliveredAccum: 0,
                statuses,
            })
        }

        const current =
            providerMap.get(provider)

        /* ==========================================
           TOTAL ENTREGABLES
           Todo el año
        ========================================== */

        current.totalDeliverables += 1


        /* ==========================================
           STATUS
           TAMBIÉN TODO EL AÑO

           IMPORTANTE:
           ahora esto ocurre ANTES de validar
           si está acumulado hasta agosto.
        ========================================== */

        const status =
            row.entregable_status?.trim() ||
            "SIN ESTADO"

        if (
            current.statuses[status] ===
            undefined
        ) {
            current.statuses[status] = 0
        }

        current.statuses[status] += 1


        /* ==========================================
           ENTREGADOS ACUMULADOS
           Solo hasta mes actual
        ========================================== */

        const isAccumulated =
            planned.getMonth() <=
            currentDate.getMonth()

        if (isAccumulated) {
            current.deliveredAccum += 1
        }
    })


    const data = [
        ...providerMap.values(),
    ].sort(
        (a, b) =>
            b.deliveredAccum -
            a.deliveredAccum
    )


    /* ==========================================
       TOTALES
    ========================================== */

    const totals = {
        totalDeliverables: 0,
        deliveredAccum: 0,
        statuses: {},
    }

    statusColumns.forEach((status) => {
        totals.statuses[status] = 0
    })

    data.forEach((item) => {
        totals.totalDeliverables +=
            item.totalDeliverables

        totals.deliveredAccum +=
            item.deliveredAccum

        statusColumns.forEach((status) => {
            totals.statuses[status] +=
                item.statuses[status] || 0
        })
    })

    return {
        data,
        statusColumns,
        totals,
    }
}


function DeliverablesByProviderTable({
    rows,
    currentDate,
    dashboardYear = 2026,
    monthLabel,
}) {
    const {
        data,
        statusColumns,
        totals,
    } = useMemo(
        () =>
            buildProviderDeliverablesData(
                rows,
                currentDate,
                dashboardYear
            ),
        [
            rows,
            currentDate,
            dashboardYear,
        ]
    )


    /*
     * Las columnas de estado
     * aparecen dinámicamente.
     */
    const gridTemplateColumns = `
        minmax(150px, 1.4fr)
        110px
        120px
        ${statusColumns
            .map(() => "110px")
            .join(" ")}
    `


    return (
        <Card className="flex h-full flex-col gap-0">

            <CardHeader className="pb-3">

                <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                    Entregables por Proveedor
                </CardTitle>

                <p className="text-sm text-slate-400">
                    Distribución acumulada a{" "}
                    {monthLabel}
                </p>

            </CardHeader>


            <CardContent className="flex min-h-0 flex-1 flex-col">

                <div className="overflow-x-auto rounded-xl border">

                    <div className="min-w-max">

                        {/* ==========================
                            HEADER
                        =========================== */}

                        <div
                            className="grid items-center bg-slate-50 px-3 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                            style={{
                                gridTemplateColumns,
                            }}
                        >

                            <span>
                                Proveedor
                            </span>

                            <span className="text-center">
                                Entregables
                                <br />
                                totales
                            </span>

                            <span className="text-center">
                                Entregados
                                <br />
                                acum.
                            </span>


                            {statusColumns.map(
                                (status) => (
                                    <span
                                        key={
                                            status
                                        }
                                        title={
                                            status
                                        }
                                        className="truncate px-1 text-center"
                                    >
                                        {status}
                                    </span>
                                )
                            )}

                        </div>


                        {/* ==========================
                            BODY
                        =========================== */}

                        <div className="max-h-[420px] overflow-y-auto">

                            {data.map(
                                (item) => (
                                    <div
                                        key={
                                            item.provider
                                        }
                                        className="grid min-h-[43px] items-center border-t px-3 text-xs transition hover:bg-slate-50"
                                        style={{
                                            gridTemplateColumns,
                                        }}
                                    >

                                        <span
                                            title={
                                                item.provider
                                            }
                                            className="truncate font-medium text-slate-700"
                                        >
                                            {
                                                item.provider
                                            }
                                        </span>


                                        <span className="text-center font-semibold text-slate-700">
                                            {formatNumber(
                                                item.totalDeliverables
                                            )}
                                        </span>


                                        <span className="text-center font-semibold text-blue-600">
                                            {formatNumber(
                                                item.deliveredAccum
                                            )}
                                        </span>


                                        {statusColumns.map(
                                            (
                                                status
                                            ) => (
                                                <span
                                                    key={
                                                        status
                                                    }
                                                    className="text-center text-slate-600"
                                                >
                                                    {formatNumber(
                                                        item
                                                            .statuses[
                                                            status
                                                        ] ||
                                                            0
                                                    )}
                                                </span>
                                            )
                                        )}

                                    </div>
                                )
                            )}

                        </div>


                        {/* ==========================
                            TOTAL
                        =========================== */}

                        <div
                            className="grid items-center border-t bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-800"
                            style={{
                                gridTemplateColumns,
                            }}
                        >

                            <span>
                                Total general
                            </span>


                            <span className="text-center">
                                {formatNumber(
                                    totals.totalDeliverables
                                )}
                            </span>


                            <span className="text-center text-blue-600">
                                {formatNumber(
                                    totals.deliveredAccum
                                )}
                            </span>


                            {statusColumns.map(
                                (status) => (
                                    <span
                                        key={
                                            status
                                        }
                                        className="text-center"
                                    >
                                        {formatNumber(
                                            totals
                                                .statuses[
                                                status
                                            ] || 0
                                        )}
                                    </span>
                                )
                            )}

                        </div>

                    </div>

                </div>

            </CardContent>

        </Card>
    )
}

function formatMoney(value) {
    return new Intl.NumberFormat(
        "es-PE",
        {
            style: "currency",
            currency: "PEN",
            notation: "compact",
            maximumFractionDigits: 2,
        }
    ).format(Number(value || 0))
}

function parseAmount(value) {
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

    const normalized =
        String(value)
            .trim()
            .replace(/\s/g, "")
            .replace(/,/g, "")

    const amount =
        Number(normalized)

    return Number.isFinite(amount)
        ? amount
        : 0
}

function buildPagadosCurveData(
    rows,
    currentDate,
    dashboardYear = DASHBOARD_YEAR
) {
    const currentMonth =
        currentDate.getMonth()

    const currentYear =
        currentDate.getFullYear()

    const base =
        MONTHS.map(
            (month, monthIndex) => ({
                month,
                monthIndex,

                migradosMonthly: 0,
                migradosAccum: 0,
                migradosAccumDisplay: null,

                entregablesMonthly: 0,
                entregablesAccum: 0,
                entregablesAccumDisplay: null,

                pagadosMonthly: 0,
                pagadosAccum: 0,
                pagadosAccumDisplay: null,
            })
        )

    rows.forEach((row) => {
        /* ==========================================
           MIGRADOS

           Línea azul:
           migrado_date_real acumulado
        ========================================== */

        const migratedDate =
            normalizeDashboardDate(
                row.migrado_date_real,
                dashboardYear
            )

        if (
            migratedDate &&
            migratedDate.getFullYear() ===
                dashboardYear
        ) {
            const monthIndex =
                migratedDate.getMonth()

            const validMonth =
                dashboardYear <
                    currentYear ||
                (
                    dashboardYear ===
                        currentYear &&
                    monthIndex <=
                        currentMonth
                )

            if (validMonth) {
                base[
                    monthIndex
                ].migradosMonthly += 1
            }
        }


        /* ==========================================
           ENTREGABLES / PAGADOS

           Ambas series necesitan
           entregable_date_planned
        ========================================== */

        const deliverableDate =
            normalizeDashboardDate(
                row.entregable_date_planned,
                dashboardYear
            )

        if (!deliverableDate) {
            return
        }

        if (
            deliverableDate.getFullYear() !==
            dashboardYear
        ) {
            return
        }

        const monthIndex =
            deliverableDate.getMonth()

        const validMonth =
            dashboardYear <
                currentYear ||
            (
                dashboardYear ===
                    currentYear &&
                monthIndex <=
                    currentMonth
            )

        if (!validMonth) {
            return
        }


        /* ENTREGABLES */

        base[
            monthIndex
        ].entregablesMonthly += 1


        /* PAGADOS Q */

        const budgetAc =
            parseAmount(
                row.budget_ac
            )

        if (budgetAc > 0) {
            base[
                monthIndex
            ].pagadosMonthly += 1
        }
    })


    let migradosAcc = 0
    let entregablesAcc = 0
    let pagadosAcc = 0


    return base.map(
        (item, index) => {
            migradosAcc +=
                item.migradosMonthly

            entregablesAcc +=
                item.entregablesMonthly

            pagadosAcc +=
                item.pagadosMonthly


            const showMonth =
                dashboardYear <
                    currentYear ||
                (
                    dashboardYear ===
                        currentYear &&
                    index <=
                        currentMonth
                )


            return {
                ...item,

                migradosAccum:
                    migradosAcc,

                migradosAccumDisplay:
                    showMonth
                        ? migradosAcc
                        : null,


                entregablesAccum:
                    entregablesAcc,

                entregablesAccumDisplay:
                    showMonth
                        ? entregablesAcc
                        : null,


                pagadosAccum:
                    pagadosAcc,

                pagadosAccumDisplay:
                    showMonth
                        ? pagadosAcc
                        : null,
            }
        }
    )
}

/* ============================================================
   MÉTRICAS FINANCIERAS
============================================================ */

function buildFinancialMetrics(
    rows,
    currentDate,
    dashboardYear = DASHBOARD_YEAR
) {
    let committed = 0
    let paidTotal = 0

    let paidDeliverablesToMonth = 0

    let deliverablesToMonthQ = 0
    let paidDeliverablesQ = 0


    rows.forEach((row) => {
        const budgetOc =
            parseAmount(
                row.budget_oc
            )

        const budgetAc =
            parseAmount(
                row.budget_ac
            )


        /*
         * 1. COMPROMETIDO
         *
         * Universo:
         * todos los identificadores filtrados.
         */
        committed +=
            budgetOc


        /*
         * 2. PAGADO TOTAL
         *
         * Universo:
         * todos los identificadores filtrados.
         *
         * Puede contener:
         * - adelanto
         * - pago por entregable
         */
        paidTotal +=
            budgetAc


        /*
         * 3. PAGADO ASOCIADO A
         * ENTREGABLES HASTA EL MES.
         */
        const deliverableDate =
            normalizeDashboardDate(
                row.entregable_date_planned,
                dashboardYear
            )


        if (!deliverableDate) {
            return
        }


        const inDashboardYear =
            deliverableDate.getFullYear() ===
                dashboardYear


        const accumulatedToMonth =
            inDashboardYear &&
            deliverableDate.getMonth() <=
                currentDate.getMonth()


        if (!accumulatedToMonth) {
            return
        }


        deliverablesToMonthQ += 1


        /*
         * SUMA MONTO PAGADO
         */
        paidDeliverablesToMonth +=
            budgetAc


        /*
         * Q pagados asociados
         * a esos entregables.
         */
        if (budgetAc > 0) {
            paidDeliverablesQ += 1
        }
    })


    const pendingAmount =
        Math.max(
            0,
            committed -
                paidTotal
        )


    const executionPct =
        committed > 0
            ? (
                paidTotal /
                committed
            ) * 100
            : 0


    const deliverablePaidSharePct =
        paidTotal > 0
            ? (
                paidDeliverablesToMonth /
                paidTotal
            ) * 100
            : 0


    const deliverableExecutionPct =
        deliverablesToMonthQ > 0
            ? (
                paidDeliverablesQ /
                deliverablesToMonthQ
            ) * 100
            : 0


    return {
        committed,
        paidTotal,
        paidDeliverablesToMonth,
        pendingAmount,

        executionPct,
        deliverablePaidSharePct,

        deliverablesToMonthQ,
        paidDeliverablesQ,
        deliverableExecutionPct,
    }
}

/* ============================================================
   CURVA S COMPONENT
============================================================ */

function PagadosCurveChart({
    data,
}) {
    return (
        <Card className="flex h-full flex-col gap-0">

            <CardHeader className="shrink-0 pb-2">

                <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                    Despliegue - Pagados
                </CardTitle>

                <p className="text-xs text-slate-400">
                    Migrados, entregables y pagados acumulados
                </p>

            </CardHeader>


            <CardContent className="flex min-h-0 flex-1 flex-col">

                <div className="min-h-[350px] flex-1">

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <ComposedChart
                            // barGap={0}
                            data={data}
                            barGap={0}
                            margin={{
                                top: 30,
                                right: 25,
                                bottom: 5,
                                left: 0,
                            }}
                        >

                            <CartesianGrid
                                vertical={false}
                                horizontal={false}
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


                            {/* ====================
                                ENTREGABLES
                            ===================== */}

                            <Bar
                                dataKey="entregablesAccumDisplay"
                                name="Entregables acumulados"
                                fill="#60A5FA"
                                barSize={22}
                                radius={[
                                    4,
                                    4,
                                    0,
                                    0,
                                ]}
                            >
                                <LabelList
                                    dataKey="entregablesAccumDisplay"
                                    position="top"
                                    fill="#1D4ED8"
                                    fontSize={10}
                                />
                            </Bar>


                            {/* ====================
                                PAGADOS
                            ===================== */}

                            <Bar
                                dataKey="pagadosAccumDisplay"
                                name="Pagados acumulados"
                                fill="#22C55E"
                                barSize={22}
                                radius={[
                                    4,
                                    4,
                                    0,
                                    0,
                                ]}
                            >
                                <LabelList
                                    dataKey="pagadosAccumDisplay"
                                    position="top"
                                    fill="#166534"
                                    fontSize={10}
                                />
                            </Bar>


                            {/* ====================
                                MIGRADOS
                            ===================== */}

                            <Line
                                type="monotone"
                                dataKey="migradosAccumDisplay"
                                name="Migrados acumulados"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                connectNulls={false}
                                dot={{
                                    r: 0,
                                    fill: "#FFFFFF",
                                    stroke:
                                        "#2563EB",
                                    strokeWidth: 2,
                                }}
                                activeDot={{
                                    r: 4,
                                }}
                            >
                                <LabelList
                                    dataKey="migradosAccumDisplay"
                                    position="top"
                                    fill="#2563EB"
                                    fontSize={10}
                                />
                            </Line>

                        </ComposedChart>

                    </ResponsiveContainer>

                </div>


                {/* LEYENDA */}

                <div className="mt-2 flex shrink-0 justify-center gap-6 pb-1 text-xs text-slate-500">

                    <div className="flex items-center gap-2">
                        <span className="h-[2px] w-6 bg-[#2563EB]" />
                        Migrados acum.
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-[#60A5FA]" />
                        Entregables acum.
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm bg-[#22C55E]" />
                        Pagados acum.
                    </div>

                </div>

            </CardContent>

        </Card>
    )
}


function PagadosKpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    tone = "blue",
    money = false,
}) {
    const tones = {
        blue: {
            icon:
                "bg-blue-50 text-blue-600",
            value:
                "text-blue-600",
        },

        green: {
            icon:
                "bg-emerald-50 text-emerald-600",
            value:
                "text-emerald-600",
        },

        orange: {
            icon:
                "bg-orange-50 text-orange-500",
            value:
                "text-orange-500",
        },

        violet: {
            icon:
                "bg-violet-50 text-violet-600",
            value:
                "text-violet-600",
        },
    }

    const style =
        tones[tone] ||
        tones.blue

    return (
        <Card className="shadow-sm gap-0 py-2">

            <CardContent className="flex h-full items-center gap-4 p-4">

                <div
                    className={`
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${style.icon}
                    `}
                >
                    <Icon className="h-6 w-6" />
                </div>


                <div className="min-w-0">

                    <p className="truncate uppercase text-sm font-medium text-slate-700">
                        {title}
                    </p>


                    <p
                        className={`
                            mt-1
                            text-2xl
                            font-semibold
                            ${style.value}
                        `}
                    >
                        {money
                            ? formatMoney(
                                  value
                              )
                            : formatNumber(
                                  value
                              )}
                    </p>


                    <p className="mt-1 truncate text-xs text-slate-400">
                        {subtitle}
                    </p>

                </div>

            </CardContent>

        </Card>
    )
}

/* ============================================================
   FINANCIAL ROW
============================================================ */

function FinancialBar({
    label,
    description,
    value,
    maxValue,
    icon: Icon,
    tone,
}) {
    const percentage =
        maxValue > 0
            ? Math.min(
                100,
                (
                    value /
                    maxValue
                ) * 100
            )
            : 0


    const toneMap = {
        blue: {
            icon:
                "bg-blue-50 text-blue-600",

            bar:
                "bg-blue-500",

            amount:
                "text-blue-600",
        },

        green: {
            icon:
                "bg-emerald-50 text-emerald-600",

            bar:
                "bg-emerald-500",

            amount:
                "text-emerald-600",
        },

        violet: {
            icon:
                "bg-violet-50 text-violet-600",

            bar:
                "bg-violet-500",

            amount:
                "text-violet-600",
        },
    }


    const style =
        toneMap[tone] ||
        toneMap.blue


    return (
        <div>

            <div className="mb-2 flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-2.5">

                    <div
                        className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${style.icon}
                        `}
                    >
                        <Icon className="h-4 w-4" />
                    </div>


                    <div className="min-w-0">

                        <p className="text-xs font-semibold text-slate-700">
                            {label}
                        </p>

                        <p className="truncate text-[10px] text-slate-400">
                            {description}
                        </p>

                    </div>

                </div>


                <span
                    className={`
                        shrink-0
                        text-base
                        font-semibold
                        ${style.amount}
                    `}
                >
                    {formatMoney(value)}
                </span>

            </div>


            <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                    className={`
                        h-full
                        rounded-full
                        transition-all
                        ${style.bar}
                    `}
                    style={{
                        width: `${percentage}%`,
                    }}
                />

            </div>


            <div className="mt-1 flex justify-end">

                <span className="text-[10px] font-medium text-slate-400">
                    {percentage.toFixed(
                        1
                    )}
                    % del comprometido
                </span>

            </div>

        </div>
    )
}

/* ============================================================
   FINANCIAL CARD
============================================================ */

function FinancialExecutionCard({
    metrics,
    monthLabel,
}) {
    const {
        committed,
        paidTotal,
        paidDeliverablesToMonth,
        pendingAmount,

        executionPct,
        deliverablePaidSharePct,

        deliverablesToMonthQ,
        paidDeliverablesQ,
        deliverableExecutionPct,
    } = metrics


    return (
        <Card className="flex h-full flex-col gap-0">

            <CardHeader className="shrink-0 pb-3">

                <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                    Ejecución Financiera
                </CardTitle>

                <p className="text-xs text-slate-400">
                    Comprometido vs. pagado
                </p>

            </CardHeader>


            <CardContent className="flex flex-1 flex-col">

                {/* ==================================
                    EMBUDO / CONVERSIÓN DE MONTOS
                =================================== */}

                <div className="space-y-4">

                    <FinancialBar
                        label="Comprometido"
                        description="Budget OC · Total identificadores"
                        value={committed}
                        maxValue={committed}
                        icon={Landmark}
                        tone="blue"
                    />


                    <FinancialBar
                        label="Pagado total"
                        description="Budget AC · Adelantos + entregables"
                        value={paidTotal}
                        maxValue={committed}
                        icon={WalletCards}
                        tone="green"
                    />


                    <FinancialBar
                        label={`Pagado con entregable ≤ ${monthLabel}`}
                        description="Budget AC asociado a entregables acumulados"
                        value={
                            paidDeliverablesToMonth
                        }
                        maxValue={committed}
                        icon={ReceiptText}
                        tone="violet"
                    />

                </div>


                {/* ==================================
                    KPIs RESUMEN
                =================================== */}

                <div className="mt-5 grid grid-cols-2 gap-2">

                    <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] text-slate-400">
                            Ejecución total
                        </p>

                        <p className="mt-1 text-xl font-semibold text-emerald-600">
                            {executionPct.toFixed(
                                1
                            )}
                            %
                        </p>

                    </div>


                    <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] text-slate-400">
                            Saldo pendiente
                        </p>

                        <p className="mt-1 text-xl font-semibold text-orange-500">
                            {formatMoney(
                                pendingAmount
                            )}
                        </p>

                    </div>


                    <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] text-slate-400">
                            Pago ligado a entregables
                        </p>

                        <p className="mt-1 text-xl font-semibold text-violet-600">
                            {deliverablePaidSharePct.toFixed(
                                1
                            )}
                            %
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                            Del pagado total
                        </p>

                    </div>


                    <div className="rounded-xl bg-slate-50 p-3">

                        <p className="text-[10px] text-slate-400">
                            Q entregables pagados
                        </p>

                        <div className="mt-1 flex items-baseline gap-1">

                            <span className="text-xl font-semibold text-blue-600">
                                {formatNumber(
                                    paidDeliverablesQ
                                )}
                            </span>

                            <span className="text-sm text-slate-400">
                                /
                            </span>

                            <span className="text-sm font-medium text-slate-600">
                                {formatNumber(
                                    deliverablesToMonthQ
                                )}
                            </span>

                        </div>

                        <p className="mt-1 text-[9px] text-slate-400">
                            {deliverableExecutionPct.toFixed(
                                1
                            )}
                            % por cantidad
                        </p>

                    </div>

                </div>


                {/* ==================================
                    FOOTER
                =================================== */}

                {/* <div className="mt-auto pt-4">

                    <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-2">

                        <CircleDollarSign className="h-4 w-4 shrink-0 text-blue-500" />

                        <p className="text-[10px] leading-relaxed text-slate-500">
                            El pagado asociado a entregables considera
                            únicamente identificadores cuya{" "}
                            <span className="font-medium text-slate-700">
                                entregable_date_planned
                            </span>{" "}
                            está acumulada hasta {monthLabel}.
                        </p>

                    </div>

                </div> */}

            </CardContent>

        </Card>
    )
}

/* ============================================================
   PAGADOS VIEW
============================================================ */

function PagadosView({
    rows = [],
    currentDate = new Date(),
    dashboardYear = DASHBOARD_YEAR,
}) {
    /*
     * Evitamos doble conteo si por alguna
     * razón el backend repite identificadores.
     */
    const filteredRows =
        useMemo(
            () =>
                uniqueRows(rows),
            [rows]
        )


    const monthLabel =
        useMemo(
            () =>
                new Intl.DateTimeFormat(
                    "es-PE",
                    {
                        month: "long",
                    }
                ).format(
                    currentDate
                ),
            [currentDate]
        )


    /* ========================================================
       CURVA S
    ======================================================== */

    const curveData =
        useMemo(
            () =>
                buildPagadosCurveData(
                    filteredRows,
                    currentDate,
                    dashboardYear
                ),
            [
                filteredRows,
                currentDate,
                dashboardYear,
            ]
        )


    /* ========================================================
       FINANCIERO
    ======================================================== */

    const financialMetrics =
        useMemo(
            () =>
                buildFinancialMetrics(
                    filteredRows,
                    currentDate,
                    dashboardYear
                ),
            [
                filteredRows,
                currentDate,
                dashboardYear,
            ]
        )


    return (
        <div className="space-y-4">

            {/* =====================================
                KPIs
            ====================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                <PagadosKpiCard
                    title="Total Entregables"
                    value={
                        financialMetrics
                            .deliverablesToMonthQ
                    }
                    subtitle={`Acumulado a ${monthLabel}`}
                    icon={Boxes}
                    tone="blue"
                />


                <PagadosKpiCard
                    title="Total Pagados"
                    value={
                        financialMetrics
                            .paidDeliverablesQ
                    }
                    subtitle="Enlaces"
                    icon={CircleCheckBig}
                    tone="green"
                />


                <PagadosKpiCard
                    title="Comprometido"
                    value={
                        financialMetrics
                            .committed
                    }
                    subtitle={`Acumulado a ${monthLabel}`}
                    icon={Landmark}
                    tone="orange"
                    money
                />


                <PagadosKpiCard
                    title="Pagado Total"
                    value={
                        financialMetrics
                            .paidTotal
                    }
                    subtitle={`Acumulado a ${monthLabel}`}
                    icon={WalletCards}
                    tone="violet"
                    money
                />

            </div>

            {/* =================================================
                CURVA + EJECUCIÓN FINANCIERA
                7 / 5
            ================================================= */}

            <div
                className="
                    grid
                    grid-cols-1
                    items-stretch
                    gap-4
                    xl:grid-cols-12
                "
            >

                <div className="min-w-0 xl:col-span-7">

                    <PagadosCurveChart
                        data={curveData}
                    />

                </div>


                <div className="min-w-0 xl:col-span-5">

                    <FinancialExecutionCard
                        metrics={
                            financialMetrics
                        }
                        monthLabel={
                            monthLabel
                        }
                    />

                </div>

            </div>

        </div>
    )
}



function groupTypologyCounts(rows = []) {
    const map = new Map()

    rows.forEach((row) => {
        const typology =
            row.project_typology?.trim() ||
            "SIN TIPOLOGÍA"

        map.set(
            typology,
            (map.get(typology) || 0) + 1
        )
    })

    return [...map.entries()]
        .map(([name, value]) => ({
            name,
            value,
        }))
        .sort(
            (a, b) => b.value - a.value
        )
}

function IngKpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    tone = "blue",
}) {
    const toneMap = {
        blue: {
            iconBg: "bg-blue-50",
            iconText: "text-blue-600",
            valueText: "text-blue-600",
        },
        green: {
            iconBg: "bg-emerald-50",
            iconText: "text-emerald-600",
            valueText: "text-emerald-600",
        },
        violet: {
            iconBg: "bg-violet-50",
            iconText: "text-violet-600",
            valueText: "text-violet-600",
        },
        amber: {
            iconBg: "bg-amber-50",
            iconText: "text-amber-600",
            valueText: "text-amber-600",
        },
    }

    const style =
        toneMap[tone] ||
        toneMap.blue

    return (
        <Card className="shadow-sm gap-0 py-2">
            <CardContent className="flex h-full items-center gap-4 p-4">
                <div
                    className={`
                        flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                        ${style.iconBg}
                        ${style.iconText}
                    `}
                >
                    <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                    <p className="truncate uppercase text-sm font-medium text-slate-700">
                        {title}
                    </p>

                    <p
                        className={`mt-1 text-2xl font-semibold ${style.valueText}`}
                    >
                        {formatNumber(value)}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

/* ============================================================
   CHART
============================================================ */

function IngAccumulatedChart({
    data,
    projectionValues = {
        "Jul.": 1232,
        "Ago.": 1260,
        "Sep.": 1350,
    },
}) {
    const chartData = useMemo(() => {
        return data.map(item => ({
            ...item,
            projection: projectionValues[item.label] ?? null,
        }))
    }, [data, projectionValues])

    return (
        <Card className="flex h-full flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                    Ingeniería - Liberados
                </CardTitle>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-4">
                <div className="min-h-[380px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{
                                top: 30,
                                right: 24,
                                bottom: 8,
                                left: 0,
                            }}
                        >
                            <CartesianGrid vertical={false} stroke="#fff" />

                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={{ stroke: "#CBD5E1" }}
                                tick={{ fontSize: 11, fill: "#64748B" }}
                            />

                            <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: "#64748B" }}
                            />

                            <Tooltip
                                formatter={(value, name) => [
                                    formatNumber(value),
                                    name === "Proyección" ? "Proyección Ingeniería" : "Liberados acumulados",
                                ]}
                            />

                            {/* REAL ACUMULADO */}
                            <Bar
                                dataKey="accumulatedDisplay"
                                name="Liberados"
                                fill="#34D399"
                                barSize={30}
                                radius={[4, 4, 0, 0]}
                            >
                                <LabelList
                                    dataKey="accumulatedDisplay"
                                    position="top"
                                    fontSize={10}
                                    fill="#2563EB"
                                    formatter={formatNumber}
                                />
                            </Bar>

                            {/* PROYECCIÓN AGO - SEP */}
                            <Line
                                type="monotone"
                                dataKey="projection"
                                name="Proyección"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                strokeDasharray="6 4"
                                connectNulls={false}
                                dot={{
                                    r: 0,
                                    fill: "#FFFFFF",
                                    stroke: "#2563EB",
                                    strokeWidth: 2,
                                }}
                                activeDot={{ r: 5 }}
                            >
                                <LabelList
                                    dataKey="projection"
                                    position="top"
                                    fontSize={10}
                                    fill="#2563EB"
                                    formatter={formatNumber}
                                />
                            </Line>

                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                height={6}
                                wrapperStyle={{ fontSize: 11 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}



function ClusterZoneCard({
    clusterData,
    zoneData,
    total,
    monthLabel,
    mode,
    onModeChange,
}) {
    const maxZone = Math.max(
        ...zoneData.map(
            (item) => item.value
        ),
        1
    )

    const titleSuffix =
        mode === "accumulated"
            ? `Acumulado a ${monthLabel}`
            : `${monthLabel}`

    const subtitle =
        mode === "accumulated"
            ? "Total acumulado"
            : "Total del mes"

    return (
        <Card className="gap-0 h-full">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-lg font-semibold tracking-wide text-blue-500">
                            Distribución por Clúster
                            {/* {titleSuffix} */}
                        </CardTitle>

                        {/* <p className="mt-1 text-xs text-slate-400">
                            {subtitle}
                        </p> */}
                    </div>

                    {/* <div className="flex rounded-lg border bg-white p-1">
                        <button
                            type="button"
                            onClick={() =>
                                onModeChange(
                                    "accumulated"
                                )
                            }
                            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                                mode ===
                                "accumulated"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            Acumulado
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onModeChange("month")
                            }
                            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                                mode === "month"
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            Mes
                        </button>
                    </div> */}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid items-center gap-2 lg:grid-cols-[170px_1fr]">
                    <div className="relative h-[170px]">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <PieChart>
                                <Pie
                                    data={clusterData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={58}
                                    outerRadius={83}
                                    stroke="#FFFFFF"
                                    strokeWidth={2}
                                    labelLine={false}
                                    label={renderClusterCountLabel}
                                >
                                    {clusterData.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <Cell
                                                key={
                                                    item.name
                                                }
                                                fill={
                                                    CLUSTER_COLORS[
                                                        index %
                                                            CLUSTER_COLORS.length
                                                    ]
                                                }
                                            />
                                        )
                                    )}
                                </Pie>

                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-semibold text-slate-800">
                                {formatNumber(total)}
                            </span>

                            <span className="text-[10px] text-slate-400">
                                Liberados
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {clusterData
                            .slice(0, 6)
                            .map(
                                (
                                    item,
                                    index
                                ) => {
                                    const pct =
                                        total
                                            ? (
                                                  item.value /
                                                  total
                                              ) * 100
                                            : 0

                                    return (
                                        <div
                                            key={
                                                item.name
                                            }
                                            className="flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            CLUSTER_COLORS[
                                                                index %
                                                                    CLUSTER_COLORS.length
                                                            ],
                                                    }}
                                                />
                                                <span className="text-slate-500">
                                                    {/* Cluster{" "} */}
                                                    {
                                                        item.name
                                                    }
                                                </span>
                                            </div>

                                            <span className="font-medium">
                                                {pct.toFixed(
                                                    1
                                                )}
                                                % (
                                                {
                                                    item.value
                                                }
                                                )
                                            </span>
                                        </div>
                                    )
                                }
                            )}
                    </div>
                </div>

                <p className="mb-3 mt-4 text-xs font-semibold text-slate-600">
                    Por Zona
                </p>

                <div className="space-y-3">
                    {zoneData
                        .slice(0, 5)
                        .map(
                            (
                                item,
                                index
                            ) => {
                                const pct =
                                    total
                                        ? (
                                              item.value /
                                              total
                                          ) * 100
                                        : 0

                                return (
                                    <div
                                        key={
                                            item.name
                                        }
                                        className="grid grid-cols-[60px_1fr_90px] items-center gap-2"
                                    >
                                        <span className="text-[11px] text-slate-500">
                                            {
                                                item.name
                                            }
                                        </span>

                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.max(
                                                        3,
                                                        (
                                                            item.value /
                                                            maxZone
                                                        ) *
                                                            100
                                                    )}%`,
                                                    backgroundColor:
                                                        ZONE_COLORS[
                                                            index %
                                                                ZONE_COLORS.length
                                                        ],
                                                }}
                                            />
                                        </div>

                                        <span className="text-right text-[11px] text-slate-600">
                                            {formatNumber(
                                                item.value
                                            )}{" "}
                                            (
                                            {pct.toFixed(
                                                1
                                            )}
                                            %)
                                        </span>
                                    </div>
                                )
                            }
                        )}
                </div>
            </CardContent>
        </Card>
    )
}

function ProviderMigrationStatusCard({
    data,
    totals,
    monthLabel,
    mode,
    onModeChange,
}) {
    const [topProviders, setTopProviders] = useState(10)

    const visibleProviderData =
        useMemo(() => {
            if (topProviders === "all") {
                return data
            }

            return data.slice(
                0,
                topProviders
            )
        }, [
            data,
            topProviders,
        ])

    const titleSuffix =
        mode === "accumulated"
            ? `Acumulado a ${monthLabel}`
            : monthLabel

    const subtitle =
        mode === "accumulated"
            ? "Migrados acumulados por proveedor"
            : "Migrados del mes por proveedor"

    return (
        <Card className="h-[620px] overflow-hidden gap-0">
            {/* =================================================
                HEADER
            ================================================= */}
            <CardHeader className="pb-2">

                <div className="flex items-start justify-between gap-3">

                    <div>
                        <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                            {/* Migrados por Proveedor -{" "}
                            {titleSuffix} */}
                            Implementados por Proveedor
                        </CardTitle>

                        {/* <p className="mt-1 text-xs text-slate-400">
                            {subtitle}
                        </p> */}
                    </div>


                    {/* ACUMULADO / MES */}

                    <div className="flex shrink-0 rounded-lg border bg-white p-1">

                        <button
                            type="button"
                            onClick={() =>
                                onModeChange(
                                    "accumulated"
                                )
                            }
                            className={`
                                rounded-md
                                px-3
                                py-1
                                text-xs
                                font-medium
                                transition

                                ${
                                    mode ===
                                    "accumulated"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50"
                                }
                            `}
                        >
                            Acumulado
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                onModeChange(
                                    "month"
                                )
                            }
                            className={`
                                rounded-md
                                px-3
                                py-1
                                text-xs
                                font-medium
                                transition

                                ${
                                    mode ===
                                    "month"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50"
                                }
                            `}
                        >
                            Mes
                        </button>

                    </div>

                </div>

            </CardHeader>
            <CardContent className="flex h-[530px] flex-col">
                {/* =================================================
                    TOOLBAR
                ================================================= */}
                <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                    {/* LEYENDA */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Implementados
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                            Pendientes
                        </div>
                    </div>
                    {/* TOP */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() =>
                                setTopProviders(
                                    10
                                )
                            }
                            className={`
                                rounded-md
                                px-2.5
                                py-1
                                text-[11px]
                                font-medium
                                transition

                                ${
                                    topProviders ===
                                    10
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Top 10
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setTopProviders(
                                    20
                                )
                            }
                            className={`
                                rounded-md
                                px-2.5
                                py-1
                                text-[11px]
                                font-medium
                                transition

                                ${
                                    topProviders ===
                                    20
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Top 20
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setTopProviders(
                                    "all"
                                )
                            }
                            className={`
                                rounded-md
                                px-2.5
                                py-1
                                text-[11px]
                                font-medium
                                transition

                                ${
                                    topProviders ===
                                    "all"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Todos
                        </button>
                    </div>
                </div>


                {/* =================================================
                    CABECERA
                ================================================= */}

                <div className="grid shrink-0 grid-cols-[125px_minmax(130px,1fr)_60px_65px_75px] items-center gap-2 border-b px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>Proveedor</span>
                    <span>Avance</span>
                    <span className="text-right">RFI</span>
                    <span className="text-right">Implementados</span>
                    <span className="text-right">Pendientes</span>
                </div>
                {/* =================================================
                    LISTADO CON SCROLL
                ================================================= */}

                <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-2">

                    <div className="space-y-1">

                        {visibleProviderData.map((item) => {
                            const migratedPct = item.total > 0 ? (item.migrated / item.total) * 100 : 0
                            const pendingPct = item.total > 0 ? (item.pending / item.total) * 100 : 0

                            return (
                                <div
                                    key={item.provider}
                                    className="grid grid-cols-[125px_minmax(130px,1fr)_60px_65px_75px] items-center gap-2 rounded-md px-1 py-2 transition-colors hover:bg-slate-50"
                                >
                                    <span title={item.provider} className="truncate text-[11px] font-medium text-slate-700">
                                        {item.provider}
                                    </span>

                                    <div className="flex min-w-0 items-center gap-2">
                                        <div className="relative h-3 min-w-[90px] flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div className="absolute left-0 top-0 h-full bg-emerald-500" style={{ width: `${migratedPct}%` }} />
                                            <div
                                                className="absolute top-0 h-full bg-orange-400"
                                                style={{ left: `${migratedPct}%`, width: `${pendingPct}%` }}
                                            />
                                        </div>

                                        <span className="w-[34px] shrink-0 text-right text-[10px] font-medium text-slate-500">
                                            {migratedPct.toFixed(0)}%
                                        </span>
                                    </div>

                                    <span className="text-right text-[11px] font-semibold text-blue-600">
                                        {formatNumber(item.rfi)}
                                    </span>

                                    <span className="text-right text-[11px] font-semibold text-emerald-600">
                                        {formatNumber(item.migrated)}
                                    </span>

                                    <span className="text-right text-[11px] font-semibold text-orange-500">
                                        {formatNumber(item.pending)}
                                    </span>
                                </div>
                            )
                        })}

                    </div>

                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}
                <div className="grid grid-cols-[125px_minmax(130px,1fr)_60px_65px_75px] items-center gap-2 border-t bg-slate-50 px-1 py-2.5 text-[11px] font-semibold">
                        <span>Total</span>
                        <span />
                        <span className="text-right text-blue-600">
                            {formatNumber(totals.rfi)}
                        </span>
                        <span className="text-right text-emerald-600">
                            {formatNumber(totals.migrated)}
                        </span>
                        <span className="text-right text-orange-500">
                            {formatNumber(totals.pending)}
                        </span>
                    </div>

                <div className="mt-2 flex shrink-0 items-center justify-between border-t pt-2 text-[10px] text-slate-400">

                    

                    <span>
                        Mostrando{" "}
                        {visibleProviderData.length}{" "}
                        de {data.length} proveedores
                    </span>

                    {topProviders !==
                        "all" &&
                        data.length >
                            visibleProviderData.length && (

                            <button
                                type="button"
                                onClick={() =>
                                    setTopProviders(
                                        "all"
                                    )
                                }
                                className="font-medium text-blue-600 hover:underline"
                            >
                                Ver todos
                            </button>

                        )}

                </div>

            </CardContent>

        </Card>
    )
}



function ProviderMigration2StatusCard({
    data,
    totals,
    monthLabel,
    mode,
    onModeChange,
}) {
    const [topProviders, setTopProviders] = useState(10)

    const visibleProviderData =
        useMemo(() => {
            if (topProviders === "all") {
                return data
            }

            return data.slice(
                0,
                topProviders
            )
        }, [
            data,
            topProviders,
        ])

    const titleSuffix =
        mode === "accumulated"
            ? `Acumulado a ${monthLabel}`
            : monthLabel

    const subtitle =
        mode === "accumulated"
            ? "Migrados acumulados por proveedor"
            : "Migrados del mes por proveedor"

    return (
        <Card className="h-[620px] overflow-hidden gap-0">
            {/* =================================================
                HEADER
            ================================================= */}
            <CardHeader className="pb-2">

                <div className="flex items-start justify-between gap-3">

                    <div>
                        <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                            {/* Migrados por Proveedor -{" "}
                            {titleSuffix} */}
                            Migrados por Proveedor
                        </CardTitle>

                        {/* <p className="mt-1 text-xs text-slate-400">
                            {subtitle}
                        </p> */}
                    </div>


                    {/* ACUMULADO / MES */}

                    <div className="flex shrink-0 rounded-lg border bg-white p-1">

                        <button
                            type="button"
                            onClick={() =>
                                onModeChange(
                                    "accumulated"
                                )
                            }
                            className={`
                                rounded-md
                                px-3
                                py-1
                                text-xs
                                font-medium
                                transition

                                ${
                                    mode ===
                                    "accumulated"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50"
                                }
                            `}
                        >
                            Acumulado
                        </button>


                        <button
                            type="button"
                            onClick={() =>
                                onModeChange(
                                    "month"
                                )
                            }
                            className={`
                                rounded-md
                                px-3
                                py-1
                                text-xs
                                font-medium
                                transition

                                ${
                                    mode ===
                                    "month"
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50"
                                }
                            `}
                        >
                            Mes
                        </button>

                    </div>

                </div>

            </CardHeader>
            <CardContent className="flex h-[530px] flex-col">
                {/* =================================================
                    TOOLBAR
                ================================================= */}
                <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                    {/* LEYENDA */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Migrados
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                            Pendientes
                        </div>
                    </div>
                    {/* TOP */}
                    <div className="flex items-center rounded-lg bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() =>
                                setTopProviders(
                                    10
                                )
                            }
                            className={`
                                rounded-md
                                px-2.5
                                py-1
                                text-[11px]
                                font-medium
                                transition

                                ${
                                    topProviders ===
                                    10
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Top 10
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setTopProviders(
                                    20
                                )
                            }
                            className={`
                                rounded-md
                                px-2.5
                                py-1
                                text-[11px]
                                font-medium
                                transition

                                ${
                                    topProviders ===
                                    20
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Top 20
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setTopProviders(
                                    "all"
                                )
                            }
                            className={`
                                rounded-md
                                px-2.5
                                py-1
                                text-[11px]
                                font-medium
                                transition

                                ${
                                    topProviders ===
                                    "all"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-500"
                                }
                            `}
                        >
                            Todos
                        </button>
                    </div>
                </div>


                {/* =================================================
                    CABECERA
                ================================================= */}

                <div className="grid shrink-0 grid-cols-[125px_minmax(130px,1fr)_60px_65px_75px] items-center gap-2 border-b px-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>Proveedor</span>
                    <span>Avance</span>
                    <span className="text-right">Impl.</span>
                    <span className="text-right">Migrados</span>
                    <span className="text-right">Pendientes</span>
                </div>
                {/* =================================================
                    LISTADO CON SCROLL
                ================================================= */}

                <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-2">

                    <div className="space-y-1">

                        {visibleProviderData.map((item) => {
                            const migratedPct = item.total > 0 ? (item.migrated / item.total) * 100 : 0
                            const pendingPct = item.total > 0 ? (item.pending / item.total) * 100 : 0

                            return (
                                <div
                                    key={item.provider}
                                    className="grid grid-cols-[125px_minmax(130px,1fr)_60px_65px_75px] items-center gap-2 rounded-md px-1 py-2 transition-colors hover:bg-slate-50"
                                >
                                    <span title={item.provider} className="truncate text-[11px] font-medium text-slate-700">
                                        {item.provider}
                                    </span>

                                    <div className="flex min-w-0 items-center gap-2">
                                        <div className="relative h-3 min-w-[90px] flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div className="absolute left-0 top-0 h-full bg-emerald-500" style={{ width: `${migratedPct}%` }} />
                                            <div
                                                className="absolute top-0 h-full bg-orange-400"
                                                style={{ left: `${migratedPct}%`, width: `${pendingPct}%` }}
                                            />
                                        </div>

                                        <span className="w-[34px] shrink-0 text-right text-[10px] font-medium text-slate-500">
                                            {migratedPct.toFixed(0)}%
                                        </span>
                                    </div>

                                    <span className="text-right text-[11px] font-semibold text-blue-600">
                                        {formatNumber(item.rfi)}
                                    </span>

                                    <span className="text-right text-[11px] font-semibold text-emerald-600">
                                        {formatNumber(item.migrated)}
                                    </span>

                                    <span className="text-right text-[11px] font-semibold text-orange-500">
                                        {formatNumber(item.pending)}
                                    </span>
                                </div>
                            )
                        })}

                    </div>

                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}
                <div className="grid grid-cols-[125px_minmax(130px,1fr)_60px_65px_75px] items-center gap-2 border-t bg-slate-50 px-1 py-2.5 text-[11px] font-semibold">
                        <span>Total</span>
                        <span />
                        <span className="text-right text-blue-600">
                            {formatNumber(totals.rfi)}
                        </span>
                        <span className="text-right text-emerald-600">
                            {formatNumber(totals.migrated)}
                        </span>
                        <span className="text-right text-orange-500">
                            {formatNumber(totals.pending)}
                        </span>
                    </div>

                <div className="mt-2 flex shrink-0 items-center justify-between border-t pt-2 text-[10px] text-slate-400">

                    

                    <span>
                        Mostrando{" "}
                        {visibleProviderData.length}{" "}
                        de {data.length} proveedores
                    </span>

                    {topProviders !==
                        "all" &&
                        data.length >
                            visibleProviderData.length && (

                            <button
                                type="button"
                                onClick={() =>
                                    setTopProviders(
                                        "all"
                                    )
                                }
                                className="font-medium text-blue-600 hover:underline"
                            >
                                Ver todos
                            </button>

                        )}

                </div>

            </CardContent>

        </Card>
    )
}


/* ============================================================
   MAPA PERÚ D3-GEO
============================================================ */

/* ============================================================
   MAPA
============================================================ */

// function PeruGeneralMap({
//     rows,
//     departmentData,
//     monthLabel,
//     mode,
// }) {
//     const MAP_WIDTH = 520
//     const MAP_HEIGHT = 500

//     const departmentMap =
//         useMemo(
//             () =>
//                 new Map(
//                     departmentData.map(
//                         (item) => [
//                             normalizeDepartment(
//                                 item.name
//                             ),
//                             item.value,
//                         ]
//                     )
//                 ),
//             [departmentData]
//         )

//     const total =
//         departmentData.reduce(
//             (acc, item) =>
//                 acc + item.value,
//             0
//         )

//     const maxValue = Math.max(
//         ...departmentData.map(
//             (item) => item.value
//         ),
//         1
//     )

//     const projection =
//         useMemo(
//             () =>
//                 geoMercator()
//                     .fitExtent(
//                         [
//                             [25, 20],
//                             [
//                                 MAP_WIDTH - 25,
//                                 MAP_HEIGHT - 20,
//                             ],
//                         ],
//                         peruDepartments
//                     ),
//             []
//         )

//     const pathGenerator =
//         useMemo(
//             () =>
//                 geoPath(projection),
//             [projection]
//         )

//     const markers =
//         useMemo(
//             () =>
//                 rows
//                     .map((row) => {
//                         const lat = Number(
//                             row.latitude
//                         )
//                         const lng = Number(
//                             row.longitude
//                         )

//                         if (
//                             !Number.isFinite(
//                                 lat
//                             ) ||
//                             !Number.isFinite(
//                                 lng
//                             )
//                         ) {
//                             return null
//                         }

//                         const point =
//                             projection([
//                                 lng,
//                                 lat,
//                             ])

//                         if (!point) {
//                             return null
//                         }

//                         return {
//                             ...row,
//                             x: point[0],
//                             y: point[1],
//                         }
//                     })
//                     .filter(Boolean),
//             [rows, projection]
//         )

//     const typologyColumns =
//             useMemo(() => {
//                 return [
//                     ...new Set(
//                         rows
//                             .map(
//                                 (row) =>
//                                     row.project_typology
//                             )
//                             .filter(Boolean)
//                     ),
//                 ].sort()
//             }, [rows])
    
//         const departmentTableData =
//             useMemo(() => {
//                 const map = new Map()
    
//                 rows.forEach((row) => {
//                     const departamento =
//                         row.departamento ||
//                         "SIN INFORMACIÓN"
    
//                     if (
//                         !map.has(
//                             departamento
//                         )
//                     ) {
//                         map.set(
//                             departamento,
//                             {
//                                 name:
//                                     departamento,
    
//                                 migrated: 0,
    
//                                 metraje: 0,
    
//                                 typologies: {},
//                             }
//                         )
//                     }
    
//                     const current =
//                         map.get(
//                             departamento
//                         )
    
//                     /*
//                     * Cada row representa
//                     * un migrado dentro del
//                     * dataset recibido.
//                     */
//                     current.migrated += 1
    
//                     /*
//                     * SUMA DE METRAJE
//                     */
//                     current.metraje +=
//                         toNumber(
//                             row.metraje
//                         )
    
//                     /*
//                     * CONTEO POR TIPOLOGÍA
//                     */
//                     const typology =
//                         row.project_typology ||
//                         "SIN TIPOLOGÍA"
    
//                     current.typologies[
//                         typology
//                     ] =
//                         (
//                             current.typologies[
//                                 typology
//                             ] || 0
//                         ) + 1
//                 })
    
//                 return [
//                     ...map.values(),
//                 ].sort(
//                     (a, b) =>
//                         b.migrated -
//                         a.migrated
//                 )
//             }, [rows])
                
    
//         const totalMigrated =
//             departmentTableData.reduce(
//                 (acc, item) =>
//                     acc + item.migrated,
//                 0
//             )
    
    
//         const totalMetraje =
//             departmentTableData.reduce(
//                 (acc, item) =>
//                     acc + item.metraje,
//                 0
//             )
    
    
//         const typologyTotals =
//             useMemo(() => {
//                 const totals = {}
    
//                 typologyColumns.forEach(
//                     (typology) => {
//                         totals[typology] = 0
//                     }
//                 )
    
//                 departmentTableData.forEach(
//                     (item) => {
//                         typologyColumns.forEach(
//                             (typology) => {
//                                 totals[
//                                     typology
//                                 ] +=
//                                     item
//                                         .typologies[
//                                         typology
//                                     ] || 0
//                             }
//                         )
//                     }
//                 )
    
//                 return totals
//             }, [
//                 departmentTableData,
//                 typologyColumns,
//             ])

//     const title =
//         mode === "accumulated"
//             ? `Despliegue de Red - Acumulado a ${monthLabel}`
//             : `Despliegue de Red - ${monthLabel}`

//     const tableTitle =
//         mode === "accumulated"
//             ? `Activados por departamento (Acumulado a ${monthLabel})`
//             : `Activados por departamento (${monthLabel})`

//     return (
//         <Card className="gap-0">
//             <CardContent className="p-4">
//                 <div className="grid gap-6 xl:grid-cols-[720px_minmax(0,1fr)]">
//                     <div>
//                         <h3 className="mb-4 |text-lg tracking-wide font-semibold text-blue-500">
//                             {title}
//                         </h3>
//                         {/* min-h-[475px]  h-[465px]*/}
//                         <div className="flex items-center justify-center rounded-xl bg-slate-50">
//                             <svg
//                                 viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
//                                 className="w-full"
//                                 preserveAspectRatio="xMidYMid meet"
//                             >
//                                 {peruDepartments?.features?.map(
//                                     (
//                                         feature,
//                                         index
//                                     ) => {
//                                         const department =
//                                             getGeoDepartmentName(
//                                                 feature
//                                             )

//                                         const value =
//                                             departmentMap.get(
//                                                 normalizeDepartment(
//                                                     department
//                                                 )
//                                             ) || 0

//                                         return (
//                                             <path
//                                                 key={`${department}-${index}`}
//                                                 d={
//                                                     pathGenerator(
//                                                         feature
//                                                     ) ||
//                                                     ""
//                                                 }
//                                                 fill={getMapColor(
//                                                     value,
//                                                     maxValue
//                                                 )}
//                                                 stroke="#FFFFFF"
//                                                 strokeWidth={
//                                                     1.1
//                                                 }
//                                             >
//                                                 <title>
//                                                     {department}{" "}
//                                                     -{" "}
//                                                     {value}{" "}
//                                                     Migrados
//                                                 </title>
//                                             </path>
//                                         )
//                                     }
//                                 )}

//                                 {markers.map(
//                                     (marker) => (
//                                         <g
//                                             key={
//                                                 marker.identificador ??
//                                                 marker.id
//                                             }
//                                             transform={`translate(${marker.x}, ${marker.y})`}
//                                         >
//                                             <circle
//                                                 r={7}
//                                                 fill="#F97316"
//                                                 opacity={
//                                                     0.15
//                                                 }
//                                             />
//                                             <circle
//                                                 r={3.7}
//                                                 fill="#F97316"
//                                                 stroke="#FFFFFF"
//                                                 strokeWidth={
//                                                     1.4
//                                                 }
//                                             />
//                                             <title>
//                                                 {
//                                                     marker.identificador
//                                                 }
//                                                 {"\n"}
//                                                 {
//                                                     marker.site
//                                                 }
//                                                 {"\n"}
//                                                 {
//                                                     marker.departamento
//                                                 }
//                                             </title>
//                                         </g>
//                                     )
//                                 )}
//                             </svg>
//                         </div>
//                     </div>

//                     <div>
//                         <h3 className="mb-4 text-lg font-semibold tracking-wide text-blue-500">
//                             {tableTitle}
//                         </h3>

//                         <div className="overflow-x-auto rounded-xl border">

//                             <div
//                                 className="grid min-w-max bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-600"
//                                 style={{
//                                     gridTemplateColumns: `
//                                         minmax(180px, 1fr)
//                                         110px
//                                         100px
//                                         ${typologyColumns
//                                             .map(
//                                                 () =>
//                                                     "90px"
//                                             )
//                                             .join(" ")}
//                                         90px
//                                     `,
//                                 }}
//                             >
//                                 <span>
//                                     Departamento
//                                 </span>

//                                 <span className="text-right">
//                                     Metraje
//                                 </span>

//                                 {typologyColumns.map(
//                                     (typology) => (
//                                         <span
//                                             key={
//                                                 typology
//                                             }
//                                             className="text-right"
//                                         >
//                                             {typology}
//                                         </span>
//                                     )
//                                 )}

//                                 <span className="text-right">
//                                     Migrados
//                                 </span>

//                                 <span className="text-right">
//                                     % del total
//                                 </span>
                                
//                             </div>


//                             {departmentTableData.map(
//                                 (item) => {
//                                     const pct =
//                                         totalMigrated
//                                             ? (
//                                                 item.migrated /
//                                                 totalMigrated
//                                             ) * 100
//                                             : 0

//                                     return (
//                                         <div
//                                             key={
//                                                 item.name
//                                             }
//                                             className="grid min-w-max items-center border-t px-4 py-2.5 text-xs"
//                                             style={{
//                                                 gridTemplateColumns: `
//                                                     minmax(180px, 1fr)
//                                                     110px
//                                                     100px
//                                                     ${typologyColumns
//                                                         .map(
//                                                             () =>
//                                                                 "90px"
//                                                         )
//                                                         .join(
//                                                             " "
//                                                         )}
//                                                     90px
//                                                 `,
//                                             }}
//                                         >
//                                             {/* DEPARTAMENTO */}

//                                             <div className="flex items-center gap-2">
//                                                 <MapPin className="h-3.5 w-3.5 text-orange-500" />

//                                                 <span>
//                                                     {
//                                                         item.name
//                                                     }
//                                                 </span>
//                                             </div>


//                                             {/* METRAJE */}

//                                             <span className="text-right font-medium">
//                                                 {formatNumber(
//                                                     item.metraje
//                                                 )}
//                                             </span>

//                                             {/* TIPOLOGÍAS */}

//                                             {typologyColumns.map(
//                                                 (
//                                                     typology
//                                                 ) => (
//                                                     <span
//                                                         key={
//                                                             typology
//                                                         }
//                                                         className="text-right text-slate-600"
//                                                     >
//                                                         {formatNumber(
//                                                             item
//                                                                 .typologies[
//                                                                 typology
//                                                             ] ||
//                                                                 0
//                                                         )}
//                                                     </span>
//                                                 )
//                                             )}

//                                             {/* TOTAL MIGRADOS */}

//                                             <span className="text-right font-semibold">
//                                                 {formatNumber(
//                                                     item.migrated
//                                                 )}
//                                             </span>


//                                             {/* % */}

//                                             <span className="text-right text-slate-500">
//                                                 {pct.toFixed(
//                                                     1
//                                                 )}
//                                                 %
//                                             </span>
//                                         </div>
//                                     )
//                                 }
//                             )}


//                             {/* TOTAL GENERAL */}

//                             <div
//                                 className="grid min-w-max border-t bg-slate-50 px-4 py-3 text-xs font-semibold"
//                                 style={{
//                                     gridTemplateColumns: `
//                                         minmax(180px, 1fr)
//                                         110px
//                                         100px
//                                         ${typologyColumns
//                                             .map(
//                                                 () =>
//                                                     "90px"
//                                             )
//                                             .join(" ")}
//                                         90px
//                                     `,
//                                 }}
//                             >
//                                 <span>
//                                     Total general
//                                 </span>

//                                 <span className="text-right">
//                                     {formatNumber(
//                                         totalMetraje
//                                     )}
//                                 </span>

//                                 <span className="text-right">
//                                     {formatNumber(
//                                         totalMigrated
//                                     )}
//                                 </span>

//                                 {typologyColumns.map(
//                                     (typology) => (
//                                         <span
//                                             key={
//                                                 typology
//                                             }
//                                             className="text-right"
//                                         >
//                                             {formatNumber(
//                                                 typologyTotals[
//                                                     typology
//                                                 ] || 0
//                                             )}
//                                         </span>
//                                     )
//                                 )}

//                                 <span className="text-right">
//                                     {totalMigrated
//                                         ? "100.0%"
//                                         : "0.0%"}
//                                 </span>
//                             </div>

//                         </div>
//                     </div>
//                 </div>
//             </CardContent>
//         </Card>
//     )
// }

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
                <div className="grid gap-6 xl:grid-cols-[720px_minmax(0,1fr)]">
                    <div>
                        <h3 className="mb-4 |text-lg tracking-wide font-semibold text-blue-500">
                            {title}
                        </h3>
{/* min-h-[475px] h-[465px] */}
                        <div className="flex min-h-[475px] items-center justify-center rounded-xl bg-slate-50">
                            <svg
                                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}

                                className=" w-full"
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {peruDepartments?.features?.map(
                                    (
                                        feature,
                                        index
                                    ) => {
                                        const department =
                                            getGeoDepartmentName(
                                                feature
                                            )

                                        const value =
                                            departmentMap.get(
                                                normalizeDepartment(
                                                    department
                                                )
                                            ) || 0

                                        return (
                                            <path
                                                key={`${department}-${index}`}
                                                d={
                                                    pathGenerator(
                                                        feature
                                                    ) ||
                                                    ""
                                                }
                                                fill={getMapColor(
                                                    value,
                                                    maxValue
                                                )}
                                                stroke="#FFFFFF"
                                                strokeWidth={
                                                    1.1
                                                }
                                            >
                                                <title>
                                                    {department}{" "}
                                                    -{" "}
                                                    {value}{" "}
                                                    Migrados
                                                </title>
                                            </path>
                                        )
                                    }
                                )}

                                {markers.map(
                                    (marker) => (
                                        <g
                                            key={
                                                marker.identificador ??
                                                marker.id
                                            }
                                            transform={`translate(${marker.x}, ${marker.y})`}
                                        >
                                            <circle
                                                r={7}
                                                fill="#F97316"
                                                opacity={
                                                    0.15
                                                }
                                            />
                                            <circle
                                                r={3.7}
                                                fill="#F97316"
                                                stroke="#FFFFFF"
                                                strokeWidth={
                                                    1.4
                                                }
                                            />
                                            <title>
                                                {
                                                    marker.identificador
                                                }
                                                {"\n"}
                                                {
                                                    marker.site
                                                }
                                                {"\n"}
                                                {
                                                    marker.departamento
                                                }
                                            </title>
                                        </g>
                                    )
                                )}
                            </svg>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-lg font-semibold tracking-wide text-blue-500">
                            {tableTitle}
                        </h3>

                        <div className="overflow-x-auto rounded-xl border">

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
                                className="grid min-w-max border-t bg-slate-50 px-4 py-3 text-xs font-semibold"
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


function PeruDeploymentMap({
    rows,
    departmentData,
    monthLabel,
}) {
    const MAP_WIDTH = 420
    const MAP_HEIGHT = 590

    const departmentMap =
        useMemo(
            () =>
                new Map(
                    departmentData.map(
                        (item) => [
                            normalizeText(
                                item.name
                            ),
                            item.value,
                        ]
                    )
                ),
            [departmentData]
        )

    const maxValue = Math.max(
        ...departmentData.map(
            (item) =>
                item.value
        ),
        1
    )

    const total =
        departmentData.reduce(
            (acc, item) =>
                acc + item.value,
            0
        )

    /*
     * D3 ajusta automáticamente
     * Perú al SVG.
     */
    const projection =
        useMemo(() => {
            return geoMercator()
                .fitExtent(
                    [
                        [25, 20],

                        [
                            MAP_WIDTH - 25,
                            MAP_HEIGHT - 20,
                        ],
                    ],
                    peruDepartments
                )
        }, [])

    const pathGenerator =
        useMemo(
            () =>
                geoPath(
                    projection
                ),
            [projection]
        )

    /*
     * Convierte:
     *
     * longitude / latitude
     *
     * en coordenadas x/y
     * dentro del SVG.
     */
    const markers =
        useMemo(() => {
            return rows
                .map((row) => {
                    const lat =
                        Number(
                            row.latitude
                        )

                    const lng =
                        Number(
                            row.longitude
                        )

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
                .filter(Boolean)
        }, [
            rows,
            projection,
        ])

    return (
        <Card className="gap-0">
            <CardHeader>
                <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                    Despliegue de Red -{" "}
                    {monthLabel}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    {/* MAPA */}
                    <div className="flex min-h-[510px] items-center justify-center rounded-xl bg-slate-50 p-2">
                        <svg
                            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                            preserveAspectRatio="xMidYMid meet"
                            className="h-[500px] w-full"
                        >
                            {/* DEPARTAMENTOS */}
                            {peruDepartments
                                ?.features
                                ?.map(
                                    (
                                        feature,
                                        index
                                    ) => {
                                        const department =
                                            getGeoDepartmentName(
                                                feature
                                            )
                                        const value =
                                            departmentMap.get(
                                                normalizeText(
                                                    department
                                                )
                                            ) || 0
                                        const fill =
                                            getMapColor(
                                                value,
                                                maxValue
                                            )
                                        return (
                                            <path
                                                key={
                                                    feature
                                                        ?.properties
                                                        ?.FIRST_IDDP ??
                                                    feature
                                                        ?.properties
                                                        ?.id ??
                                                    `${department}-${index}`
                                                }
                                                d={
                                                    pathGenerator(
                                                        feature
                                                    ) || ""
                                                }
                                                fill={
                                                    fill
                                                }
                                                stroke="#FFFFFF"
                                                strokeWidth={
                                                    1.1
                                                }
                                                className="cursor-pointer transition-opacity hover:opacity-75"
                                            >
                                                <title>
                                                    {department}
                                                    {" - "}
                                                    {value}
                                                    {" activados"}
                                                </title>

                                            </path>
                                        )
                                    }
                                )}

                            {/* SITIOS */}
                            {markers.map(
                                (marker) => (
                                    <g
                                        key={
                                            marker.identificador ??
                                            marker.id
                                        }
                                        transform={`translate(${marker.x}, ${marker.y})`}
                                        className="cursor-pointer"
                                    >
                                        <circle
                                            r={7}
                                            fill="#EF4444"
                                            opacity={0.16}
                                        />
                                        <circle
                                            r={3.8}
                                            fill="#F97316"
                                            stroke="#FFFFFF"
                                            strokeWidth={1.4}
                                        />
                                        <title>
                                            {marker.identificador}
                                            {"\n"}
                                            {marker.site}
                                            {"\n"}
                                            {marker.departamento}
                                            {" / "}
                                            {marker.distrito}
                                        </title>

                                    </g>
                                )
                            )}
                        </svg>
                    </div>
                    {/* TABLA */}
                    <div className="min-w-0">
                        <div className="grid grid-cols-[1fr_100px_100px] border-b border-slate-200 px-2 pb-2 text-[11px] font-semibold uppercase text-slate-400">
                            <span>
                                Departamento
                            </span>
                            <span className="text-right">
                                Activados
                            </span>
                            <span className="text-right">
                                % del total
                            </span>
                        </div>
                        <div className="mt-1">
                            {departmentData.map(
                                (item) => {
                                    const pct =
                                        total
                                            ? (
                                                item.value /
                                                total
                                            ) * 100
                                            : 0

                                    return (
                                        <div
                                            key={
                                                item.name
                                            }
                                            className="grid grid-cols-[1fr_100px_100px] items-center rounded-md px-2 py-2 text-xs transition-colors hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                                                <span className="font-medium text-slate-700">
                                                    {
                                                        item.name
                                                    }
                                                </span>
                                            </div>
                                            <span className="text-right font-semibold text-slate-700">
                                                {formatNumber(
                                                    item.value
                                                )}
                                            </span>
                                            <span className="text-right text-slate-500">
                                                {pct.toFixed(
                                                    2
                                                )}
                                                %
                                            </span>

                                        </div>
                                    )
                                }
                            )}
                        </div>
                        {departmentData.length === 0 && (
                            <div className="py-12 text-center text-sm text-slate-400">
                                No existen activaciones para el mes seleccionado.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SummaryRow({
    icon: Icon,
    label,
    sublabel,
    value,
    valueClassName = "text-slate-700",
    iconClassName = "text-blue-600",
}) {
    return (
        <div className="grid min-h-[44px] grid-cols-[1fr_auto] items-center gap-3 border-t border-slate-100 px-3">
            <div className="flex min-w-0 items-center gap-2.5">
                <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />

                <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-600">
                        {label}
                    </p>

                    {sublabel && (
                        <p className="text-[9px] text-slate-400">
                            {sublabel}
                        </p>
                    )}
                </div>
            </div>

            <span className={`whitespace-nowrap text-sm font-semibold ${valueClassName}`}>
                {value}
            </span>
        </div>
    )
}

function MiniProcessBox({
    title,
    value,
    subtitle,
    tone = "blue",
    compact = false,
}) {
    const toneMap = {
        blue: {
            border: "border-blue-300",
            bg: "bg-blue-50/60",
            title: "text-slate-500",
            subtitle: "text-slate-800",
            value: "text-blue-600",
        },
        green: {
            border: "border-emerald-300",
            bg: "bg-emerald-50/60",
            title: "text-slate-500",
            subtitle: "text-slate-800",
            value: "text-emerald-600",
        },
        gray: {
            border: "border-slate-300",
            bg: "bg-white",
            title: "text-slate-500",
            subtitle: "text-slate-800",
            value: "text-slate-700",
        },
    }

    const style = toneMap[tone]

    return (
        <div
            className={`
                rounded-xl border-2 border-dashed px-4 py-3
                ${style.border}
                ${style.bg}
                ${compact ? "min-w-[120px]" : "min-w-[150px]"}
            `}
        >
            <p className={`text-[10px] ${style.title}`}>
                {title}
            </p>

            <div className="mt-1 flex items-end justify-between gap-3">
                <p className={`text-sm font-semibold ${style.subtitle}`}>
                    {subtitle}
                </p>

                <span className={`text-xl font-semibold ${style.value}`}>
                    {formatNumber(value)}
                </span>
            </div>
        </div>
    )
}

function ConnectorArrow() {
    return (
        <div className="flex items-center justify-center px-1 text-slate-700">
            <span className="text-3xl font-semibold leading-none">
                ›
            </span>
        </div>
    )
}

function ProcessTraceabilityInline({
    previousStage,
    previousValue,

    currentStage,
    currentValue,

    actualValue,
    monthMeta,
    monthLabel = "Agosto",
}) {
    const previous = Number(previousValue || 0)
    const current = Number(currentValue || 0)
    const actual = Number(actualValue || 0)
    const meta = Number(monthMeta || 0)

    const processGap = current - previous
    const conversion =
        previous > 0 ? (current / previous) * 100 : 0

    const inProgress = Math.max(0, current - actual)
    const alert = Math.max(0, meta - actual)

    return (
        <Card className="overflow-hidden">
            <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-[15px] font-semibold tracking-wide text-blue-500">
                    Trazabilidad desde etapa anterior
                </CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-4">
                {/* =====================================
                    TRAZABILIDAD HORIZONTAL
                ====================================== */}

                <div className="overflow-x-auto">
                    <div className="flex min-w-[520px] items-center justify-between gap-2">
                        <MiniProcessBox
                            title="Etapa anterior"
                            subtitle={previousStage}
                            value={previous}
                            tone="blue"
                        />

                        <ConnectorArrow />

                        <MiniProcessBox
                            title="Brecha"
                            subtitle=""
                            value={processGap}
                            tone="gray"
                            compact
                        />

                        <ConnectorArrow />

                        <MiniProcessBox
                            title="Etapa actual"
                            subtitle={currentStage}
                            value={current}
                            tone="green"
                        />
                    </div>
                </div>

                {/* =====================================
                    RESUMEN
                ====================================== */}

                <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Resumen
                    </p>

                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <SummaryRow
                            icon={RefreshCcw}
                            label="% Conversión"
                            value={`${conversion.toFixed(1)}%`}
                            valueClassName="text-blue-600"
                            iconClassName="text-blue-600"
                        />

                        <SummaryRow
                            icon={CheckCircle2}
                            label="Actual"
                            sublabel={currentStage}
                            value={formatNumber(actual)}
                            valueClassName="text-emerald-600"
                            iconClassName="text-emerald-500"
                        />

                        <SummaryRow
                            icon={Clock3}
                            label="En proceso"
                            sublabel="Brecha"
                            value={formatNumber(inProgress)}
                            valueClassName="text-blue-600"
                            iconClassName="text-blue-500"
                        />

                        <SummaryRow
                            icon={Target}
                            label={`Meta ${monthLabel}`}
                            sublabel="Acumulado"
                            value={formatNumber(meta)}
                            valueClassName="text-orange-500"
                            iconClassName="text-orange-500"
                        />

                        <SummaryRow
                            icon={AlertTriangle}
                            label="Alerta"
                            sublabel="Pendiente para meta"
                            value={`${formatNumber(alert)} pendiente`}
                            valueClassName={
                                alert > 0
                                    ? "text-red-500"
                                    : "text-emerald-600"
                            }
                            iconClassName={
                                alert > 0
                                    ? "text-red-500"
                                    : "text-emerald-500"
                            }
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


function ProcessTraceability({
    previousStage,
    previousValue,

    currentStage,
    currentValue,

    actualValue,

    monthMeta,
    monthLabel = "Agosto",

    previousIcon: PreviousIcon = RadioTower,
    currentIcon: CurrentIcon = Wrench,
}) {
    const previous = Number(previousValue || 0)
    const current = Number(currentValue || 0)
    const actual = Number(actualValue || 0)
    const meta = Number(monthMeta || 0)
    /* =============================================
       BRECHA ENTRE PROCESOS
    ============================================= */

    const processGap = previous - current 

    /* =============================================
       % CONVERSIÓN ENTRE ETAPAS
    ============================================= */
    const conversion = previous > 0
        ? (current / previous) * 100
        : 0

    /* =============================================
       EN PROCESO
       De los 930 que ya llegaron a la etapa,
       708 están ejecutados.
       930 - 708 = 222
    ============================================= */

    // const inProgress = Math.max(0, current - actual)

    /* =============================================
       ALERTA
       Pendiente para alcanzar la meta acumulada.
       930 - 708 = 222
    ============================================= */
    const alert = Math.max(0, meta - actual)

    return (
        <Card className="overflow-hidden gap-0">
            {/* =====================================
                HEADER
            ====================================== */}
            <CardHeader className="px-4 pb-2">
                <CardTitle
                    className="
                        text-[15px]
                        font-semibold
                        tracking-wide
                        text-blue-500
                    "
                >
                    Trazabilidad
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {/* =================================
                    BLOQUE FUNNEL
                ================================== */}
                <div className="relative">
                    {/* =============================
                        ETAPA ANTERIOR
                    ============================== */}
                    <div
                        className="
                            relative
                            z-20
                            flex
                            min-h-[64px]
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            border-blue-200
                            bg-gradient-to-r
                            from-blue-50
                            to-white
                            px-3.5
                            shadow-sm
                        "
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-blue-100
                                    text-blue-600
                                "
                            >
                                <PreviousIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] text-slate-400">
                                    Etapa anterior
                                </p>
                                <p className="truncate text-xs font-semibold text-slate-800">
                                    {previousStage}
                                </p>
                            </div>
                        </div>
                        <span
                            className="
                                shrink-0
                                text-lg
                                font-semibold
                                text-blue-600
                            "
                        >
                            {formatNumber(
                                previous
                            )}
                        </span>
                    </div>
                    {/* =============================
                        FUNNEL / BRECHA
                    ============================== */}
                    <div className="relative -mt-[2px] h-[80px]">
                        {/* Forma */}
                        <div
                            className="
                                absolute
                                inset-x-0
                                top-0
                                h-full
                                bg-gradient-to-b
                                from-blue-100/90
                                via-blue-50
                                to-emerald-50/80
                            "
                            style={{
                                clipPath:
                                    "polygon(0 0, 100% 0, 72% 100%, 28% 100%)",
                            }}
                        />
                        {/* Línea */}
                        <div
                            className="
                                absolute
                                left-1/2
                                top-2
                                h-[57px]
                                -translate-x-1/2
                                border-l
                                border-dashed
                                border-blue-300
                            "
                        />
                        {/* Brecha */}
                        <div
                            className="
                                absolute
                                left-1/2
                                top-[19px]
                                z-10
                                -translate-x-1/2
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-1.5
                                text-center
                                shadow-sm
                            "
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-500">
                                    Brecha
                                </span>
                                <span className="text-sm font-semibold text-slate-800">
                                    {formatNumber(processGap)}
                                </span>
                            </div>
                        </div>
                        {/* Flecha */}
                        {/* <ArrowDown
                            className="
                                absolute
                                bottom-1
                                left-1/2
                                z-10
                                h-4
                                w-4
                                -translate-x-1/2
                                text-slate-500
                            "
                        /> */}
                    </div>
                    {/* =============================
                        ETAPA ACTUAL
                    ============================== */}
                    <div
                        className="
                            relative
                            z-20
                            -mt-[2px]
                            flex
                            min-h-[64px]
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            border-emerald-300
                            bg-gradient-to-r
                            from-emerald-50
                            to-white
                            px-3.5
                            shadow-sm
                        "
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-emerald-100
                                    text-emerald-600
                                "
                            >
                                <CurrentIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] text-slate-400">
                                    Etapa actual
                                </p>
                                <p className="truncate text-xs font-semibold text-slate-800">
                                    {currentStage}
                                </p>
                            </div>
                        </div>
                        <span
                            className="
                                shrink-0
                                text-lg
                                font-semibold
                                text-emerald-600
                            "
                        >
                            {formatNumber(
                                current
                            )}
                        </span>
                    </div>
                </div>
                {/* =================================
                    RESUMEN
                ================================== */}
                <div className="mt-4">
                    <p
                        className="
                            mb-2
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-slate-500
                        "
                    >
                        Resumen
                    </p>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        {/* % CONVERSIÓN */}
                        <SummaryRow
                            icon={RefreshCcw}
                            label="% Conversión"
                            value={`${conversion.toFixed(1)}%`}
                            valueClassName="text-blue-600"
                            iconClassName="text-blue-600"
                        />
                        {/* META */}
                        <SummaryRow
                            icon={Target}
                            label={`Meta ${monthLabel}`}
                            sublabel="Acumulado"
                            value={formatNumber(meta)}
                            valueClassName="text-orange-500"
                            iconClassName="text-orange-500"
                        />
                        {/* ACTUAL */}
                        <SummaryRow
                            icon={CheckCircle2}
                            label="Actual"
                            sublabel={currentStage}
                            value={`${formatNumber(actual)}`}
                            valueClassName="text-emerald-600"
                            iconClassName="text-emerald-500"
                        />
                        {/* EN PROCESO */}
                        <SummaryRow
                            icon={Clock3}
                            label="En proceso"
                            sublabel="Brecha"
                            value={formatNumber(processGap)}
                            valueClassName="text-blue-600"
                            iconClassName="text-blue-500"
                        />
                        {/* ALERTA */}
                        <SummaryRow
                            icon={AlertTriangle}
                            label="Alerta"
                            sublabel="Pendiente para meta"
                            value={`${formatNumber(
                                alert
                            )} pendiente`}
                            valueClassName={
                                alert > 0
                                    ? "text-red-500"
                                    : "text-emerald-600"
                            }
                            iconClassName={
                                alert > 0
                                    ? "text-red-500"
                                    : "text-emerald-500"
                            }
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}



/* ============================================================
   VISTA IMPLEMENTACIÓN
============================================================ */

function MigrationView({
    rows,
    currentDate,
    metrics,
    activeDistributionRows,
    providerMigrationData,
    providerTotals,
    distributionMode,
    setDistributionMode,
}) {
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

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


    const statistics =
        useMemo(() => {
            /*
             * TOTAL FCST
             *
             * Todos los sitios planificados
             * para activación durante el año.
             */
            const yearPlannedRows =
                rows.filter(
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
                )

            /*
             * TOTAL ACTIVADOS
             *
             * Todos los sitios con fecha real
             * dentro del año y hasta hoy.
             */
            const yearActivatedRows =
                rows.filter(
                    (row) => {
                        const date =
                            normalizeDashboardDate(
                                row.activado_date_real
                            )

                        return (
                            date &&
                            date.getFullYear() ===
                                currentYear &&
                            date <= currentDate
                        )
                    }
                )


            /*
             * META MES
             *
             * Cohorte cuya fecha PLAN
             * pertenece al mes actual.
             */
            const monthPlannedRows =
                rows.filter(
                    (row) =>
                        isSameMonth(
                            normalizeDashboardDate(
                                row.activado_date_planned
                            ),
                            currentDate
                        )
                )

            /*
             * AVANCE DEL MES
             *
             * De la cohorte planificada
             * para agosto, cuántos tienen
             * activado_date_real.
             *
             * Puede incluir un activado
             * anticipado si la fecha real
             * fue anterior al mes planificado.
             */
            const monthActivatedRows =
                monthPlannedRows.filter(
                    (row) => {
                        const real =
                            normalizeDashboardDate(
                                row.activado_date_real
                            )

                        return (
                            real &&
                            real <= currentDate
                        )
                    }
                )

            const fcstTotal = yearPlannedRows.length
            const totalActivated = yearActivatedRows.length
            const metaMonth = monthPlannedRows.length
            const activatedMonth = monthActivatedRows.length
            const monthProgress =
                metaMonth > 0
                    ? (
                        activatedMonth /
                        metaMonth
                    ) * 100
                    : 0

            return {
                fcstTotal,
                totalActivated,
                metaMonth,
                activatedMonth,
                monthProgress,
                monthPlannedRows,
                monthActivatedRows,
            }

        }, [
            rows,
            currentDate,
            currentYear,
            currentMonth,
        ])

    const curveData =
        useMemo(
            () =>
                buildSCurve(
                    rows,
                    currentYear,
                    currentDate
                ),
            [
                rows,
                currentYear,
                currentDate,
            ]
        )

    /*
     * El circular solamente usa
     * los sitios de la meta del mes
     * que ya fueron activados.
     */
    const clusterData =
        useMemo(
            () =>
                groupByCount(
                    statistics.monthActivatedRows,
                    "cluster"
                ),
            [
                statistics.monthActivatedRows,
            ]
        )

    const zoneData =
        useMemo(
            () =>
                groupByCount(
                    statistics.monthActivatedRows,
                    "zona"
                ),
            [
                statistics.monthActivatedRows,
            ]
        )

    // const departmentData =
    //     useMemo(
    //         () =>
    //             groupByCount(
    //                 statistics.monthActivatedRows,
    //                 "departamento"
    //             ),
    //         [
    //             statistics.monthActivatedRows,
    //         ]
    //     )

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
        <div className="space-y-4">
            {/* =================================================
                KPIs
            ================================================= */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Total FCST"
                    value={formatNumber(statistics.fcstTotal)}
                    subtitle={`Plan ${currentYear}`}
                    icon={RadioTower}
                    tone="blue"
                />
                <KpiCard
                    title="Total Migrados"
                    value={formatNumber(statistics.totalActivated)}
                    subtitle={`Migrados ${currentYear}`}
                    icon={CheckCircle2}
                    tone="green"
                />
                <KpiCard
                    title={`Meta ${monthOnlyLabel}`}
                    value={formatNumber(metrics.migratedMonthPlanned)}
                    subtitle="Migraciones Planificadas"
                    icon={Target}
                    tone="orange"
                />
                <KpiCard
                    title={`% Avance ${monthOnlyLabel}`}
                    // value={`${statistics.monthProgress.toFixed(
                    //     1
                    // )}%`}
                    value={`${(statistics.totalActivated / metrics.migratedMonthPlanned * 100).toFixed(0)}%`}
                    // subtitle={`${formatNumber(
                    //     statistics.activatedMonth
                    // )} de ${formatNumber(
                    //     statistics.metaMonth
                    // )} Implementados`}
                    subtitle={""}
                    icon={Target}
                    tone="purple"
                />
            </div>

            {/* =================================================
                CURVA S + DISTRIBUCIÓN
            ================================================= */}
            <div className="">
                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                    {/* CURVA S */}
                    <Card className="gap-0 min-w-0 h-full xl:col-span-8">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                                Despliegue - Migraciones
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="">
                            <div className="h-[430px]">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <ComposedChart
                                        data={curveData}
                                        margin={{
                                            top: 25,
                                            right: 25,
                                            bottom: 5,
                                            left: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            // stroke="#E2E8F0"
                                            strokeDasharray="3 3"
                                            stroke="#fffff"
                                        />
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            axisLine={{
                                                stroke:
                                                    "#CBD5E1",
                                            }}
                                            tick={{
                                                fontSize:
                                                    11,
                                                fill:
                                                    "#64748B",
                                            }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize:
                                                    11,
                                                fill:
                                                    "#64748B",
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(
                                                value,
                                                name
                                            ) => {

                                                if (
                                                    name ===
                                                    "Plan Acumulado"
                                                ) {
                                                    return [
                                                        formatNumber(
                                                            value
                                                        ),
                                                        "Plan Acumulado",
                                                    ]
                                                }

                                                return [
                                                    formatNumber(
                                                        value
                                                    ),
                                                    "Real Acumulado",
                                                ]
                                            }}
                                        />
                                        <Bar
                                            dataKey="realMigAccumDisplay"
                                            name="Real Acumulado"
                                            fill="#34D399"
                                            barSize={25}
                                            radius={[
                                                4,
                                                4,
                                                0,
                                                0,
                                            ]}
                                        >
                                            <LabelList
                                                dataKey="realMigAccumDisplay"
                                                position="insideBottom"
                                                fill="#047857"
                                                fontSize={11}
                                            />
                                        </Bar>
                                        <Line
                                            type="monotone"
                                            dataKey="planAccum"
                                            name="Plan Acumulado"
                                            stroke="#1545FF"
                                            strokeWidth={2.5}
                                            activeDot={{
                                                r: 0,
                                            }}
                                            dot={{
                                                r: 0,
                                                fill:
                                                    "#FFFFFF",
                                                stroke:
                                                    "#1545FF",
                                                strokeWidth:
                                                    2,
                                            }}
                                        >
                                            <LabelList
                                                dataKey="planAccum"
                                                position="top"
                                                fill="#1545FF"
                                                fontSize={11}
                                            />
                                        </Line>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 flex justify-center gap-6 text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span className="h-[2px] w-6 bg-blue-600" />
                                    Plan Acc
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 bg-emerald-400" />
                                    Real Acc
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                {/* CLUSTER */}
                {/* <ClusterZoneCard
                    clusterData={clusterData}
                    zoneData={zoneData}
                    total={activeDistributionRows.length}
                    monthLabel={monthLabel}
                    mode={distributionMode}
                    onModeChange={setDistributionMode}
                /> */}
                    <div className="min-w-0 h-full xl:col-span-4">
                        <ProcessTraceability
                            previousStage="Implementados"
                            previousValue={930}
                            previousIcon={Wrench}

                            currentStage="Migrados"
                            currentValue={850}
                            currentIcon={Wrench}

                            actualValue={850}
                            monthMeta={879}
                        />
                    </div>
                    
                </div>
            </div>
            

            <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                <div className="min-w-0 h-full xl:col-span-6">
                    <ProviderMigration2StatusCard
                        data={providerMigrationData}
                        totals={providerTotals}
                        monthLabel={monthLabel}
                        mode={distributionMode}
                        onModeChange={setDistributionMode}
                    />
                </div>
                <div className="min-w-0 h-full xl:col-span-6">
                    <MonthlyDeploymentChart data={MONTHLY_DATA} />
                </div>
            </div>

            {/* =================================================
                MAPA
            ================================================= */}
            {/* <PeruGeneralMap
                rows={activeDistributionRows}
                departmentData={departmentData}
                monthLabel={monthLabel}
                mode={distributionMode}
            /> */}
            {/* <PeruGeneralMap
                rows={activeDistributionRows}
                departmentData={departmentData}
                monthLabel={monthLabel}
                mode={distributionMode}
            /> */}
        </div>
    )
}


/* ============================================================
   VISTA IMPLEMENTACIÓN
============================================================ */

function EntregableView({
    rows = [],
    currentDate = new Date(),
    dashboardYear = 2026,
}) {
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

    const monthLabel = useMemo(() => {
        return new Intl.DateTimeFormat(
            "es-PE",
            {
                month: "long",
            }
        ).format(currentDate)
    }, [currentDate])

    const curveData = useMemo(() => {
        return buildEntregablesCurveData(
            rows,
            currentDate,
            dashboardYear
        )
    }, [
        rows,
        currentDate,
        dashboardYear,
    ])

    // const liberatedRows =
    //     useMemo(() => {
    //         return rows.filter(
    //             (row) =>
    //                 !!parseDMY(
    //                     row.migrado_date_real
    //                 )
    //         )
    //     }, [rows])

    console.log("curveData", curveData)

    const statusMetrics = useMemo(() => {
        return buildEntregablesStatusData(
            rows,
            currentDate,
            dashboardYear
        )
    }, [
        rows,
        currentDate,
        dashboardYear,
    ])


    const monthOnlyLabel =
        new Intl.DateTimeFormat(
            "es-PE",
            {
                month: "long",
            }
        ).format(currentDate)


    const statistics =
        useMemo(() => {
            /*
             * TOTAL FCST
             *
             * Todos los sitios planificados
             * para activación durante el año.
             */
            const yearPlannedRows =
                rows.filter(
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
                )

            /*
             * TOTAL ACTIVADOS
             *
             * Todos los sitios con fecha real
             * dentro del año y hasta hoy.
             */
            const yearActivatedRows =
                rows.filter(
                    (row) => {
                        const date =
                            normalizeDashboardDate(
                                row.activado_date_real
                            )

                        return (
                            date &&
                            date.getFullYear() ===
                                currentYear &&
                            date <= currentDate
                        )
                    }
                )


            /*
             * META MES
             *
             * Cohorte cuya fecha PLAN
             * pertenece al mes actual.
             */
            const monthPlannedRows =
                rows.filter(
                    (row) =>
                        isSameMonth(
                            normalizeDashboardDate(
                                row.activado_date_planned
                            ),
                            currentDate
                        )
                )

            /*
             * AVANCE DEL MES
             *
             * De la cohorte planificada
             * para agosto, cuántos tienen
             * activado_date_real.
             *
             * Puede incluir un activado
             * anticipado si la fecha real
             * fue anterior al mes planificado.
             */
            const monthActivatedRows =
                monthPlannedRows.filter(
                    (row) => {
                        const real =
                            normalizeDashboardDate(
                                row.activado_date_real
                            )

                        return (
                            real &&
                            real <= currentDate
                        )
                    }
                )

            const fcstTotal = yearPlannedRows.length
            const totalActivated = yearActivatedRows.length
            const metaMonth = monthPlannedRows.length
            const activatedMonth = monthActivatedRows.length
            const monthProgress =
                metaMonth > 0
                    ? (
                        activatedMonth /
                        metaMonth
                    ) * 100
                    : 0

            return {
                fcstTotal,
                totalActivated,
                metaMonth,
                activatedMonth,
                monthProgress,
                monthPlannedRows,
                monthActivatedRows,
            }

        }, [
            rows,
            currentDate,
            currentYear,
            currentMonth,
        ])

    /*
     * El circular solamente usa
     * los sitios de la meta del mes
     * que ya fueron activados.
     */
    // const clusterData =
    //     useMemo(
    //         () =>
    //             groupByCount(
    //                 statistics.monthActivatedRows,
    //                 "cluster"
    //             ),
    //         [
    //             statistics.monthActivatedRows,
    //         ]
    //     )

    // const zoneData =
    //     useMemo(
    //         () =>
    //             groupByCount(
    //                 statistics.monthActivatedRows,
    //                 "zona"
    //             ),
    //         [
    //             statistics.monthActivatedRows,
    //         ]
    //     )

    // const departmentData =
    //     useMemo(
    //         () =>
    //             groupByCount(
    //                 statistics.monthActivatedRows,
    //                 "departamento"
    //             ),
    //         [
    //             statistics.monthActivatedRows,
    //         ]
    //     )

    // const departmentData =
    //     useMemo(
    //         () =>
    //             groupByCount(
    //                 activeDistributionRows,
    //                 "departamento"
    //             ),
    //         [activeDistributionRows]
    //     )

    return (
        <div className="space-y-4">
            {/* =================================================
                KPIs
            ================================================= */}
            {/* <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"> */}
                {/* <KpiCard
                    title="Total FCST"
                    value={formatNumber(statistics.fcstTotal)}
                    subtitle={`Plan ${currentYear}`}
                    icon={RadioTower}
                    tone="blue"
                />
                <KpiCard
                    title="Total Migrados"
                    value={formatNumber(statistics.totalActivated)}
                    subtitle={`Migrados ${currentYear}`}
                    icon={CheckCircle2}
                    tone="green"
                />
                <KpiCard
                    title={`Meta ${monthOnlyLabel}`}
                    value={formatNumber(metrics.migratedMonthPlanned)}
                    subtitle="Migraciones Planificadas"
                    icon={Target}
                    tone="orange"
                />
                <KpiCard
                    title={`% Avance ${monthOnlyLabel}`}
                    value={`${(statistics.totalActivated / metrics.migratedMonthPlanned * 100).toFixed(0)}%`}
                    subtitle={""}
                    icon={Target}
                    tone="purple"
                /> */}
            {/* </div> */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

                <PagadosKpiCard
                    title="Total Migrados"
                    value={850}
                    subtitle={`Acumulado a ${monthLabel}`}
                    icon={Boxes}
                    tone="green"
                />


                <PagadosKpiCard
                    title="Entregables"
                    value={statusMetrics.total}
                    subtitle="Enlaces"
                    icon={CircleCheckBig}
                    tone="blue"
                />

                <PagadosKpiCard
                    title="Pendientes"
                    value={850 - statusMetrics.total}
                    subtitle="Enlaces"
                    icon={Landmark}
                    tone="orange"
                />

            </div>

            {/* =================================================
                CURVA S + DISTRIBUCIÓN
            ================================================= */}
            <div className="">
                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                    <div className="min-w-0 xl:col-span-8">
                        <EntregablesCurveChart
                            data={curveData}
                        />
                    </div>

                    <div className="min-w-0 xl:col-span-4">
                        <EntregablesStatusDonut
                            total={statusMetrics.total}
                            data={statusMetrics.data}
                            monthLabel={monthLabel}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12 mt-4">
                    <div className="min-w-0 xl:col-span-12">
                        <DeliverablesByProviderTable
                            rows={rows}
                            currentDate={currentDate}
                            dashboardYear={dashboardYear}
                            monthLabel={monthLabel}
                        />
                    </div>
                </div>
            </div>
            {/* <ProviderMigrationStatusCard
                data={providerMigrationData}
                totals={providerTotals}
                monthLabel={monthLabel}
                mode={distributionMode}
                onModeChange={setDistributionMode}
            /> */}
            {/* =================================================
                MAPA
            ================================================= */}
            {/* <PeruGeneralMap
                rows={activeDistributionRows}
                departmentData={departmentData}
                monthLabel={monthLabel}
                mode={distributionMode}
            /> */}
            {/* <PeruGeneralMap
                rows={activeDistributionRows}
                departmentData={departmentData}
                monthLabel={monthLabel}
                mode={distributionMode}
            /> */}
        </div>
    )
}


function IngView({
    rows,
    currentDate,
    metrics,
    // activeDistributionRows,
    // providerMigrationData,
    // providerTotals,
    distributionMode,
    setDistributionMode,
    dashboardYear,
    // clusterData
}) {
    // const rows = useMemo(
    //     () => uniqueRows(data),
    //     [data]
    // )

    const liberatedRows =
        useMemo(() => {
            return rows.filter(
                (row) =>
                    !!parseDMY(
                        row.ing_date_real
                    )
            )
        }, [rows])

    const totalLiberated = liberatedRows.length

    const typologyCounts =
        useMemo(() => {
            return groupTypologyCounts(
                liberatedRows
            )
        }, [liberatedRows])

    const curveData = useMemo(
        () =>
            buildEngineeringCurveData(
                liberatedRows,
                dashboardYear
            ),
        [
            liberatedRows,
            dashboardYear,
        ]
    )

    const clusterDataIng = useMemo(
        () =>
            groupByCount(
                metrics.ingRealArr,
                "cluster"
            ),
        [metrics.ingRealArr]
    )

    const zoneData = useMemo(
        () =>
            groupByCount(
                metrics.ingRealArr,
                "zona"
            ),
        [metrics.ingRealArr]
    )

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

    return (
        <div className="space-y-4">
            {/* =========================================
                KPIs
            ========================================== */}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                <IngKpiCard
                    title="Total Liberados"
                    value={totalLiberated}
                    subtitle={`Registros`}
                    icon={CheckCircle2}
                    tone="green"
                />

                {typologyCounts.map(
                    (item, index) => (
                        <IngKpiCard
                            key={item.name}
                            title={item.name}
                            value={item.value}
                            subtitle={`Liberados`}
                            icon={
                                index % 2 === 0
                                    ? Layers3
                                    : Cog
                            }
                            tone={
                                index % 3 === 0
                                    ? "blue"
                                    : index % 3 === 1
                                    ? "violet"
                                    : "amber"
                            }
                        />
                    )
                )}
            </div>
            {/* =========================================
                CURVA
            ========================================== */}
            {/* grid col 8 and 4 */}
            <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                <div className="min-w-0 h-full xl:col-span-7">
                    <IngAccumulatedChart
                        data={curveData}
                    />
                </div>
                <div className="min-w-0 h-full xl:col-span-5">
                    <ClusterZoneCard
                        clusterData={clusterDataIng}
                        zoneData={zoneData}
                        total={metrics.ingReal}
                        monthLabel={monthLabel}
                        mode={distributionMode}
                        onModeChange={setDistributionMode}
                    />
                </div>
            </div>
        </div>
    )
}



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
        // h-[430px] 
        <Card className="overflow-hidden gap-0">
            <CardHeader className="pb-1">
                <CardTitle className="mb-4 text-lg font-semibold tracking-wide text-blue-500">
                    Cableados y Balanceos
                </CardTitle>
            </CardHeader>

            <CardContent className="h-[465px] px-4 pb-4">
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



function ImplementationView({
    rows,
    currentDate,
    metrics,
    activeDistributionRows,
    providerMigrationData,
    providerTotals,
    distributionMode,
    setDistributionMode,
}) {
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

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


    const statistics =
        useMemo(() => {
            /*
             * TOTAL FCST
             *
             * Todos los sitios planificados
             * para activación durante el año.
             */
            const yearPlannedRows =
                rows.filter(
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
                )

            /*
             * TOTAL ACTIVADOS
             *
             * Todos los sitios con fecha real
             * dentro del año y hasta hoy.
             */
            const yearActivatedRows =
                rows.filter(
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
                )


            /*
             * META MES
             *
             * Cohorte cuya fecha PLAN
             * pertenece al mes actual.
             */
            const monthPlannedRows =
                rows.filter(
                    (row) =>
                        isSameMonth(
                            normalizeDashboardDate(
                                row.activado_date_planned
                            ),
                            currentDate
                        )
                )

            /*
             * AVANCE DEL MES
             *
             * De la cohorte planificada
             * para agosto, cuántos tienen
             * activado_date_real.
             *
             * Puede incluir un activado
             * anticipado si la fecha real
             * fue anterior al mes planificado.
             */
            const monthActivatedRows =
                monthPlannedRows.filter(
                    (row) => {
                        const real =
                            normalizeDashboardDate(
                                row.activado_date_real
                            )

                        return (
                            real &&
                            real <= currentDate
                        )
                    }
                )

            const fcstTotal = yearPlannedRows.length
            const totalActivated = yearActivatedRows.length
            const metaMonth = monthPlannedRows.length
            const activatedMonth = monthActivatedRows.length
            const monthProgress =
                metaMonth > 0
                    ? (
                        activatedMonth /
                        metaMonth
                    ) * 100
                    : 0

            return {
                fcstTotal,
                totalActivated,
                metaMonth,
                activatedMonth,
                monthProgress,
                monthPlannedRows,
                monthActivatedRows,
            }

        }, [
            rows,
            currentDate,
            currentYear,
            currentMonth,
        ])

    const curveData =
        useMemo(
            () =>
                buildSCurve(
                    rows,
                    currentYear,
                    currentDate
                ),
            [
                rows,
                currentYear,
                currentDate,
            ]
        )

    /*
     * El circular solamente usa
     * los sitios de la meta del mes
     * que ya fueron activados.
     */
    const clusterData =
        useMemo(
            () =>
                groupByCount(
                    statistics.monthActivatedRows,
                    "cluster"
                ),
            [
                statistics.monthActivatedRows,
            ]
        )

    const zoneData =
        useMemo(
            () =>
                groupByCount(
                    statistics.monthActivatedRows,
                    "zona"
                ),
            [
                statistics.monthActivatedRows,
            ]
        )

    // const departmentData =
    //     useMemo(
    //         () =>
    //             groupByCount(
    //                 statistics.monthActivatedRows,
    //                 "departamento"
    //             ),
    //         [
    //             statistics.monthActivatedRows,
    //         ]
    //     )

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
        <div className="space-y-4">
            {/* =================================================
                KPIs
            ================================================= */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Total FCST"
                    value={formatNumber(statistics.fcstTotal)}
                    subtitle={`Plan ${currentYear}`}
                    icon={RadioTower}
                    tone="blue"
                />
                <KpiCard
                    title="Total Implementados"
                    value={formatNumber(statistics.totalActivated + 80)}
                    subtitle={`Implementados ${currentYear}`}
                    icon={CheckCircle2}
                    tone="green"
                />
                <KpiCard
                    title={`Meta ${monthOnlyLabel}`}
                    value={formatNumber(metrics.migratedMonthPlanned)}
                    subtitle="Implementaciones planificadas"
                    icon={Target}
                    tone="orange"
                />
                <KpiCard
                    title={`% Avance ${monthOnlyLabel}`}
                    // value={`${statistics.monthProgress.toFixed(
                    //     1
                    // )}%`}
                    value={`${(statistics.totalActivated / metrics.migratedMonthPlanned * 100).toFixed(0)}%`}
                    // subtitle={`${formatNumber(
                    //     statistics.activatedMonth
                    // )} de ${formatNumber(
                    //     statistics.metaMonth
                    // )} Implementados`}
                    subtitle={""}
                    icon={Target}
                    tone="purple"
                />
            </div>

            {/* =================================================
                CURVA S + DISTRIBUCIÓN
            ================================================= */}
            <div className="">
                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                    {/* CURVA S */}
                    <Card className="gap-0 min-w-0 h-full xl:col-span-8">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                                Despliegue - Implementados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="">
                            <div className="h-[430px]">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <ComposedChart
                                        data={curveData}
                                        margin={{
                                            top: 25,
                                            right: 25,
                                            bottom: 5,
                                            left: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            vertical={false}
                                            // stroke="#E2E8F0"
                                            strokeDasharray="3 3"
                                            stroke="#fffff"
                                        />
                                        <XAxis
                                            dataKey="month"
                                            tickLine={false}
                                            axisLine={{
                                                stroke:
                                                    "#CBD5E1",
                                            }}
                                            tick={{
                                                fontSize:
                                                    11,
                                                fill:
                                                    "#64748B",
                                            }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fontSize:
                                                    11,
                                                fill:
                                                    "#64748B",
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(
                                                value,
                                                name
                                            ) => {

                                                if (
                                                    name ===
                                                    "Plan Acumulado"
                                                ) {
                                                    return [
                                                        formatNumber(
                                                            value
                                                        ),
                                                        "Plan Acumulado",
                                                    ]
                                                }

                                                return [
                                                    formatNumber(
                                                        value
                                                    ),
                                                    "Real Acumulado",
                                                ]
                                            }}
                                        />
                                        <Line
                                            dataKey="rfiRealAccumDisplay"
                                            name="RFI Liberados"
                                            stroke="#FD6C98"
                                            strokeWidth={2.5}
                                            connectNulls={false}
                                            dot={false}
                                        >
                                            <LabelList
                                                dataKey="rfiRealAccumDisplay"
                                                position="top"
                                                fill="#FD6C98"
                                                fontSize={11}
                                            />
                                        </Line>

                                        <Bar
                                            dataKey="realAccumDisplay"
                                            name="Real Acumulado"
                                            fill="#34D399"
                                            barSize={25}
                                            radius={[4, 4, 0, 0]}
                                        >
                                            <LabelList
                                                dataKey="realAccumDisplay"
                                                position="insideBottom"
                                                fill="#047857"
                                                fontSize={11}
                                            />
                                        </Bar>
                                        <Line
                                            type="monotone"
                                            dataKey="planAccumDisplay"
                                            name="Plan Acumulado"
                                            stroke="#1545FF"
                                            strokeWidth={2.5}
                                            connectNulls={false}
                                            dot={false}
                                        >
                                            <LabelList
                                                dataKey="planAccum"
                                                position="top"
                                                fill="#1545FF"
                                                fontSize={11}
                                            />
                                        </Line>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-2 flex justify-center gap-6 text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span className="h-[2px] w-6 bg-[#FD6C98]" />
                                    RFI
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-[2px] w-6 bg-blue-600" />
                                    Plan Acc
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 bg-emerald-400" />
                                    Real Acc
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* CLUSTER */}
                    {/* <ClusterZoneCard
                        clusterData={clusterData}
                        zoneData={zoneData}
                        total={activeDistributionRows.length}
                        monthLabel={monthLabel}
                        mode={distributionMode}
                        onModeChange={setDistributionMode}
                    /> */}
                    <div className="min-w-0 h-full xl:col-span-4">
                        <ProcessTraceability
                            previousStage="RFI"
                            previousValue={1103}
                            previousIcon={Wrench}

                            currentStage="Implementados"
                            currentValue={930}
                            currentIcon={Wrench}

                            actualValue={930}
                            monthMeta={897}
                        />
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
                    <div className="min-w-0 h-full xl:col-span-6">
                        <ProviderMigrationStatusCard
                            data={providerMigrationData}
                            totals={providerTotals}
                            monthLabel={monthLabel}
                            mode={distributionMode}
                            onModeChange={setDistributionMode}
                        />
                    </div>
                    <div className="min-w-0 h-full xl:col-span-6">
                        <MonthlyDeploymentChart data={MONTHLY_DATA} />
                    </div>
                </div>
                {/* <ProviderMigrationStatusCard
                    data={providerMigrationData}
                    totals={providerTotals}
                    monthLabel={monthLabel}
                    mode={distributionMode}
                    onModeChange={setDistributionMode}
                /> */}
            </div>
            {/* =================================================
                MAPA
            ================================================= */}
            {/* <PeruGeneralMap
                rows={activeDistributionRows}
                departmentData={departmentData}
                monthLabel={monthLabel}
                mode={distributionMode}
            /> */}
            {/* <PeruGeneralMap
                rows={activeDistributionRows}
                departmentData={departmentData}
                monthLabel={monthLabel}
                mode={distributionMode}
            /> */}
        </div>
    )
}


function getStatusStyle(status) {
    switch (status) {
        case "AL DÍA":
            return "bg-emerald-500 text-white"

        case "PEND.":
            return "bg-red-500 text-white"

        case "PARCIAL":
            return "bg-amber-500 text-white"

        default:
            return "bg-slate-400 text-white"
    }
}


function getRankColor(index, total) {
    /*
     * De verde -> amarillo -> naranja,
     * similar a la tabla de referencia.
     */
    const startHue = 145
    const endHue = 28

    const ratio =
        total <= 1
            ? 0
            : index / (total - 1)

    const hue =
        startHue -
        (
            startHue -
            endHue
        ) *
            ratio

    return `hsl(${hue} 72% 43%)`
}

function PostRentalTable({
    data = POST_RENTAL_DATA,
}) {
    const sortedData = useMemo(() => {
        return [...data].sort(
            (a, b) =>
                b.totalPosts -
                a.totalPosts
        )
    }, [data])

    const totalPosts =
        useMemo(() => {
            return sortedData.reduce(
                (acc, item) =>
                    acc +
                    Number(
                        item.totalPosts ||
                            0
                    ),
                0
            )
        }, [sortedData])

    return (
        <Card className="h-[490px] overflow-hidden px-4 gap-0">
            <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
               Postes
            </CardTitle>
            <CardContent className="h-full p-2">
                <div className="flex h-full flex-col">
                    {/* ==========================================
                        TABLE HEADER
                    ========================================== */}
                    <div className="shrink-0 overflow-hidden rounded-t-xl">
                        <table className="w-full table-fixed border-collapse text-xs">
                            <colgroup>
                                <col className="w-[34px]" />
                                <col className="w-[30%]" />
                                <col className="w-[16%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[14%]" />
                                <col className="w-[16%]" />
                            </colgroup>
                            <thead>
                                {/* HEADER SUPERIOR */}
                                <tr className="text-[10px] font-bold uppercase text-white">
                                    <th
                                        colSpan={5}
                                        className="border-r border-white/60 bg-[#075F55] px-2 py-1 text-center"
                                    >
                                        Arrendamiento de Postes
                                    </th>
                                    <th className="border-r border-white/60 bg-[#075F55] px-1 py-1 text-center">
                                        Contrato
                                    </th>
                                    <th className="bg-[#176982] px-1 py-1">
                                        &nbsp;
                                    </th>
                                </tr>
                                {/* HEADER COLUMNAS */}
                                <tr className="text-[9px] font-semibold uppercase leading-tight text-white">
                                    <th className="border-r border-white/50 bg-[#075F55] px-1 py-1.5 text-center">
                                        #
                                    </th>
                                    <th className="border-r border-white/50 bg-[#075F55] px-2 py-1.5 text-left">
                                        Concesionaria
                                    </th>
                                    <th className="border-r border-white/50 bg-[#075F55] px-1 py-1.5 text-center">
                                        Total
                                        <br />
                                        Postes
                                    </th>
                                    <th className="border-r border-white/50 bg-[#075F55] px-1 py-1.5 text-center">
                                        BT
                                        <br />
                                        (S/)
                                    </th>
                                    <th className="border-r border-white/50 bg-[#075F55] px-1 py-1.5 text-center">
                                        MT
                                        <br />
                                        (S/)
                                    </th>
                                    <th className="border-r border-white/50 bg-[#075F55] px-1 py-1.5 text-center">
                                        Renov.
                                        <br />
                                        Auto.
                                    </th>
                                    <th className="bg-[#176982] px-1 py-1.5 text-center">
                                        Status Pago
                                    </th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    {/* ==========================================
                        BODY CON SCROLL
                    ========================================== */}
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <table className="w-full table-fixed border-collapse text-[11px]">
                            <colgroup>
                                <col className="w-[34px]" />
                                <col className="w-[30%]" />
                                <col className="w-[16%]" />
                                <col className="w-[12%]" />
                                <col className="w-[12%]" />
                                <col className="w-[14%]" />
                                <col className="w-[16%]" />
                            </colgroup>

                            <tbody>
                                {sortedData.map(
                                    (
                                        item,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                item.concessionaire
                                            }
                                            className={`
                                                border-b
                                                border-slate-200

                                                ${
                                                    index %
                                                        2 ===
                                                    0
                                                        ? "bg-white"
                                                        : "bg-slate-50/70"
                                                }

                                                hover:bg-blue-50/60
                                            `}
                                        >
                                            {/* RANK */}
                                            <td className="px-1 py-[5px] text-center">
                                                <span
                                                    className="
                                                        inline-flex
                                                        h-[19px]
                                                        w-[19px]
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        text-[9px]
                                                        font-bold
                                                        text-white
                                                    "
                                                    style={{
                                                        backgroundColor:
                                                            getRankColor(
                                                                index,
                                                                sortedData.length
                                                            ),
                                                    }}
                                                >
                                                    {index + 1}
                                                </span>
                                            </td>

                                            {/* CONCESIONARIA */}
                                            <td
                                                title={item.concessionaire}
                                                className="truncate px-2 py-[5px] font-semibold text-slate-700"
                                            >
                                                {item.concessionaire}
                                            </td>
                                            {/* TOTAL */}
                                            <td className="px-1 py-[5px] text-center text-sm font-bold text-slate-800">
                                                {formatNumber(
                                                    item.totalPosts
                                                )}
                                            </td>
                                            {/* BT */}
                                            <td className="px-1 py-[5px] text-center text-slate-500">
                                                {item.bt}
                                            </td>
                                            {/* MT */}
                                            <td className="px-1 py-[5px] text-center text-slate-500">
                                                {item.mt}
                                            </td>
                                            {/* AUTO RENEW */}
                                            <td className="px-1 py-[5px] text-center">
                                                <span
                                                    className={`
                                                        inline-flex
                                                        min-w-[48px]
                                                        justify-center
                                                        rounded
                                                        px-2
                                                        py-1
                                                        text-[9px]
                                                        font-bold
                                                        text-white

                                                        ${
                                                            item.autoRenew
                                                                ? "bg-emerald-500"
                                                                : "bg-red-500"
                                                        }
                                                    `}
                                                >
                                                    {item.autoRenew
                                                        ? "Sí"
                                                        : "No"}
                                                </span>
                                            </td>
                                            {/* STATUS */}
                                            <td className="px-1 py-[5px] text-center">
                                                <span
                                                    className={`
                                                        inline-flex
                                                        min-w-[58px]
                                                        justify-center
                                                        rounded
                                                        px-2
                                                        py-1
                                                        text-[8px]
                                                        font-bold

                                                        ${getStatusStyle(
                                                            item.status
                                                        )}
                                                    `}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ==========================================
                        FOOTER
                    ========================================== */}
                    <div className="flex shrink-0 items-center justify-between border-t bg-slate-50 px-3 py-2 text-[10px]">
                        <span className="text-slate-500">
                            {sortedData.length} concesionarias
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">
                                Total postes
                            </span>
                            <span className="font-bold text-slate-800">
                                {formatNumber(
                                    totalPosts
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


/* ============================================================
   VIEW PERMISOLOGIA
============================================================ */

function PermisologiaView({
    rows,
    currentDate,
    metrics,
    activeDistributionRows,
    distributionMode,
    setDistributionMode,
}) {

    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()

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

    const curveData =
        useMemo(
            () =>
                buildSCurve(
                    rows,
                    currentYear,
                    currentDate
                ),
            [
                rows,
                currentYear,
                currentDate,
            ]
        )

    console.log("curveData", curveData)
    console.log("rows", rows)
    console.log("metrics", metrics)

    /* ============================================================
   DATA ARRENDAMIENTO
============================================================ */

    const rentalData = [
        {
            concessionaire: "INTEGRATEL",
            totalPosts: 33641,
            bt: "3.75",
            mt: "6.88",
            autoRenew: false,
            status: "PARCIAL",
        },
        {
            concessionaire: "PLUZ",
            totalPosts: 14311,
            bt: "US$1",
            mt: "—",
            autoRenew: true,
            status: "PEND.",
        },
        {
            concessionaire: "HIDRANDINA",
            totalPosts: 3107,
            bt: "3.00",
            mt: "6.00",
            autoRenew: true,
            status: "PEND.",
        },
        {
            concessionaire: "ENSA",
            totalPosts: 2266,
            bt: "3.20",
            mt: "6.00",
            autoRenew: true,
            status: "AL DÍA",
        },
        {
            concessionaire: "LUZ DEL SUR",
            totalPosts: 2208,
            bt: "Var.",
            mt: "Var.",
            autoRenew: true,
            status: "PEND.",
        },
        {
            concessionaire: "ENOSA",
            totalPosts: 2138,
            bt: "3.00",
            mt: "6.00",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "ELECTRODUNAS",
            totalPosts: 1024,
            bt: "7.00",
            mt: "7.00",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "ELSE",
            totalPosts: 1006,
            bt: "3.86",
            mt: "8.85",
            autoRenew: true,
            status: "AL DÍA",
        },
        {
            concessionaire: "SEAL",
            totalPosts: 997,
            bt: "3.50",
            mt: "7.10",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "ELECTRO ORIENTE",
            totalPosts: 514,
            bt: "0.34",
            mt: "0.96",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "ELECTROSUR",
            totalPosts: 373,
            bt: "4.52",
            mt: "13.21",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "ELECTROCENTRO",
            totalPosts: 285,
            bt: "3.00",
            mt: "6.00",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "ELECTRO UCAYALI",
            totalPosts: 228,
            bt: "1.04",
            mt: "4.15",
            autoRenew: true,
            status: "PARCIAL",
        },
        {
            concessionaire: "TUCUMÉ",
            totalPosts: 158,
            bt: "~4.17",
            mt: "—",
            autoRenew: false,
            status: "PEND.",
        },
        {
            concessionaire: "ELECTROPUNO",
            totalPosts: 74,
            bt: "US$0.36",
            mt: "US$1.12",
            autoRenew: false,
            status: "AL DÍA",
        },
        {
            concessionaire: "EMSEU",
            totalPosts: 23,
            bt: "—",
            mt: "3.20",
            autoRenew: false,
            status: "PEND.",
        },
    ]

    return (
        <div className="space-y-4">
            {/* =================================================
                KPIs
            ================================================= */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Liberados"
                    value={formatNumber(metrics.rfiPlanned)}
                    subtitle="Enlaces"
                    icon={RadioTower}
                    tone="blue"
                />
                <KpiCard
                    title="RFI"
                    value={formatNumber(metrics.rfiReal)}
                    subtitle={`RFI ${currentYear}`}
                    icon={CheckCircle2}
                    tone="green"
                />
                <KpiCard
                    title={`Meta ${monthOnlyLabel}`}
                    value={formatNumber(metrics.rfiMonthPlanned)}
                    subtitle="RFI planificadas"
                    icon={Target}
                    tone="orange"
                />
                <KpiCard
                    title={`% Avance ${monthOnlyLabel}`}
                    // value={`${statistics.monthProgress.toFixed(
                    //     1
                    // )}%`}
                    value={`${(metrics.rfiReal / metrics.rfiMonthPlanned * 100).toFixed(0)}%`}
                    // subtitle={`${formatNumber(
                    //     statistics.activatedMonth
                    // )} de ${formatNumber(
                    //     statistics.metaMonth
                    // )} Implementados`}
                    subtitle={""}
                    icon={Target}
                    tone="purple"
                />
            </div>

            {/* =================================================
                CURVA S + DISTRIBUCIÓN
            ================================================= */}
            <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-12">
                {/* CURVA S */}
                <Card className="gap-0 col-span-8 h-full">
                    <CardHeader className="shrink-0 pb-2">
                        <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">
                            Despliegue - RFI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1">
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <ComposedChart
                                    data={curveData}
                                    margin={{
                                        top: 25,
                                        right: 25,
                                        bottom: 5,
                                        left: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        // stroke="#E2E8F0"
                                        strokeDasharray="3 3"
                                        stroke="#fffff"
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={{stroke: "#CBD5E1"}}
                                        tick={{
                                            fontSize:
                                                11,
                                            fill:
                                                "#64748B",
                                        }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fontSize:
                                                11,
                                            fill:
                                                "#64748B",
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(
                                            value,
                                            name
                                        ) => {

                                            if (
                                                name ===
                                                "Plan Acumulado"
                                            ) {
                                                return [
                                                    formatNumber(
                                                        value
                                                    ),
                                                    "Plan Acumulado",
                                                ]
                                            }

                                            return [
                                                formatNumber(
                                                    value
                                                ),
                                                "Real Acumulado",
                                            ]
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ingRealAccumDisplay"
                                        name="Liberados"
                                        stroke="#2563EB"
                                        strokeWidth={2.5}
                                        dot={false}
                                    >
                                        <LabelList
                                            dataKey="ingRealAccumDisplay"
                                            position="top"
                                            fill="#2563EB"
                                            fontSize={11}
                                        />
                                    </Line>
                                    <Bar
                                        dataKey="rfiRealAccumDisplay"
                                        name="Real Acumulado"
                                        fill="#FD6C98"
                                        barSize={25}
                                        radius={[
                                            4,
                                            4,
                                            0,
                                            0,
                                        ]}
                                    >
                                        <LabelList
                                            dataKey="rfiRealAccumDisplay"
                                            position="insideBottom"
                                            fill="#6b7280"
                                            fontSize={11}
                                        />
                                    </Bar>
                                    <Line
                                        type="monotone"
                                        dataKey="rfiFcstAccumDisplay"
                                        name="Plan Acumulado"
                                        stroke="#FF3D00"
                                        strokeWidth={2.5}
                                        activeDot={{
                                            r: 0,
                                        }}
                                        dot={{
                                            r: 0,
                                            fill:
                                                "#FFFFFF",
                                            stroke:
                                                "#1545FF",
                                            strokeWidth:
                                                2,
                                        }}
                                    >
                                        <LabelList
                                            dataKey="rfiFcstAccumDisplay"
                                            position="top"
                                            fill="#FF3D00"
                                            fontSize={11}
                                        />
                                    </Line>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-2 flex justify-center gap-6 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="h-[2px] w-6 bg-[#2563EB]" />
                                Liberados
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-[2px] w-6 bg-[#FF3D00]" />
                                Plan Acc
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 bg-[#FD6C98]" />
                                Real Acc
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* CLUSTER */}
                {/* <div className="min-w-0">
                    <PostRentalTable
                        data={rentalData}
                    />
                </div> */}
                <div className="col-span-4 xl:col-span-4">
                    <ProcessTraceability
                        previousStage="Ingenería"
                        previousValue={1232}
                        previousIcon={RadioTower}

                        currentStage="RFI"
                        currentValue={1103}
                        currentIcon={Wrench}

                        actualValue={1103}
                        monthMeta={950}

                    />
                    {/* <ProcessTraceabilityInline
                        previousStage="RFI"
                        previousValue={1103}
                        currentStage="Implementación"
                        currentValue={930}
                        actualValue={708}
                        monthMeta={930}
                        monthLabel="Agosto"
                    /> */}
                </div>
                
                


            </div>
            <div className="min-w-0 grid w-full grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="col-span-12 xl:col-span-12">
                        <PostRentalTable
                            data={rentalData}
                        />
                    </div>
                    
                </div>

        </div>
    )
}

/* ============================================================
   PLACEHOLDER OTROS MACROPROCESOS
============================================================ */

function MacroprocessPlaceholder({
    process,
}) {
    return (
        <Card>
            <CardContent className="flex min-h-[550px] items-center justify-center">
                <div className="max-w-md text-center">
                    <p className="text-lg font-semibold text-slate-700">
                        {process?.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                        Aquí se conectarán las gráficas y tablas propias de este macroproceso.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function DashboardTxProcess() {

    const [distributionMode, setDistributionMode] = useState("accumulated")

    const currentDate = new Date()

    const currentYear = currentDate.getFullYear()
    // const currentMonth = currentDate.getMonth()
    /*
     * ---------------------------------------------------------
     * MACROPROCESO SELECCIONADO
     * ---------------------------------------------------------
     */
    const [
        selectedProcess,
        setSelectedProcess,
    ] = useState(
        "ingenieria"
    )

    /*
     * ---------------------------------------------------------
     * FILTROS
     * ---------------------------------------------------------
     */

    const [selectedTypologies, setSelectedTypologies] = useState([])
    const [selectedProject, setSelectedProject] = useState("")
    const [selectedState, setSelectedState] = useState("")
    const [search, setSearch] = useState("")

    /*
     * ---------------------------------------------------------
     * DATA BASE
     * ---------------------------------------------------------
     */
    const rows = useMemo(
            () =>
                uniqueRows(data),
            [data]
        )

    /*
     * ---------------------------------------------------------
     * OPCIONES FILTROS
     * ---------------------------------------------------------
     */

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


    const stateOptions =
        useMemo(
            () =>
                [
                    ...new Set(
                        rows
                            .map(
                                (row) =>
                                    row.state
                            )
                            .filter(Boolean)
                    ),
                ].sort(),

            [rows]
        )

    /*
     * ---------------------------------------------------------
     * FILTRO FINAL
     * ---------------------------------------------------------
     */
    const filteredRows =
        useMemo(() => {
            const searchNormalized = normalizeText(search)

            return rows.filter(
                (row) => {

                    const matchTypology =
                        selectedTypologies.length ===
                            0 ||
                        selectedTypologies.includes(
                            row.project_typology
                        )


                    const matchProject =
                        !selectedProject ||
                        row.project_mac ===
                            selectedProject


                    const matchState =
                        !selectedState ||
                        row.state ===
                            selectedState


                    const searchableText =
                        normalizeText(
                            [
                                row.identificador,
                                row.site,
                                row.project_code,
                                row.project_name,
                                row.project_mac,
                                row.project_sub,
                                row.departamento,
                                row.provincia,
                                row.distrito,
                                row.proveedor,
                            ]
                                .filter(Boolean)
                                .join(" ")
                        )


                    const matchSearch =
                        !searchNormalized ||
                        searchableText.includes(
                            searchNormalized
                        )


                    return (
                        matchTypology &&
                        matchProject &&
                        matchState &&
                        matchSearch
                    )
                }
            )

        }, [
            rows,
            selectedTypologies,
            selectedProject,
            selectedState,
            search,
        ])

    /*
     * ---------------------------------------------------------
     * LIMPIAR FILTROS
     * ---------------------------------------------------------
     */
    function clearFilters() {
        setSelectedTypologies([])
        setSelectedProject("")
        setSelectedState("")
        setSearch("")
    }


    const metrics =
    useMemo(() => {
        const total = filteredRows.length

        const ingReal =
            filteredRows.filter(
                (row) =>
                    row.ing_date_real
            ).length

        const ingRealArr = filteredRows.filter(
            (row) =>
                row.ing_date_real
        )

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
                            row.activado_date_real
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

        return {
            total,

            ingReal,
            ingRealArr,

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
        }
    }, [
        filteredRows,
        currentYear,
        currentDate,
    ])

    const activeDistributionRows = distributionMode === "accumulated"
        ? metrics.accumulatedActivatedRows
        : metrics.monthActivatedRows


    const providerMigrationData =
        useMemo(() => {
            return buildProviderMigrationData(
                filteredRows,
                currentDate,
                distributionMode
            )
        }, [
            filteredRows,
            currentDate,
            distributionMode,
        ])

    const providerTotals = useMemo(() => {
        return providerMigrationData.reduce(
            (acc, item) => {
                acc.rfi += item.rfi
                acc.migrated += item.migrated
                acc.pending += item.pending
                acc.total += item.total
                return acc
            },
            { rfi: 0, migrated: 0, pending: 0, total: 0 }
        )
    }, [providerMigrationData])



    const clusterData =
        useMemo(
            () =>
                groupByCount(
                    activeDistributionRows,
                    "cluster"
                ),
            [activeDistributionRows]
        )

    const zoneData =
        useMemo(
            () =>
                groupByCount(
                    activeDistributionRows,
                    "zona"
                ),
            [activeDistributionRows]
        )

    const departmentData =
        useMemo(
            () =>
                groupByCount(
                    activeDistributionRows,
                    "departamento"
                ),
            [activeDistributionRows]
        )


    const selectedProcessDefinition =
        PROCESS_DEFINITIONS.find(
            (item) =>
                item.key ===
                selectedProcess
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
                                <Link aria-current="page" to="/projects/dashboard" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                        <Gauge /> General
                                    </div>
                                </Link>
                            </div>
                            <div className="">
                                <Link to="/projects/dashboard/process" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
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
                <h2 className="text-2xl font-semibold text-[#2b7fff]">Transporte | Macroprocesos</h2>
            </div>
            <div className="col-span-12 space-y-3">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-12 space-y-3">
                        <Card className="shadow-sm overflow-hidden p-0 gap-0">
                            <CardHeader className="relative pt-3">
                                <CardTitle className="text-lg tracking-wide font-semibold text-blue-500">Filtros Avanzados</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <SimpleSelect
                                        value={selectedProject}
                                        onChange={setSelectedProject}
                                        options={projectOptions}
                                        allLabel="Todos los proyectos"
                                    />
                                    {/* <SimpleSelect
                                        value={selectedState}
                                        onChange={setSelectedState}
                                        options={stateOptions}
                                        allLabel="Todos los estados"
                                    /> */}
                                    <div className="relative min-w-[260px] flex-1">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Código, sitio, identificador o proyecto..."
                                            className="pl-9"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSearch("")
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                    >
                                        Limpiar filtros
                                    </Button>
                                </div>
                                {/* PROJECT TYPOLOGY */}
                                <div className="border-t p-4">
                                    <TypologyMultiSelect
                                        options={typologyOptions}
                                        selected={selectedTypologies}
                                        onChange={setSelectedTypologies}
                                    />
                                </div>
                            </CardContent>

                            {/* <CardContent className="space-y-3 grid gap-4 pb-3 grid-cols-4">

                                <div>
                                    <MultiSelectFilter
                                        label="Tipo Proyecto"
                                        icon={Layers3}
                                        options={flt.options.tipoProyectos}
                                        selected={flt.tipoProyecto}
                                        onChange={flt.setTipoProyecto}
                                        placeholder="Uno o varios tipos"
                                    />
                                </div>
                                <div>
                                    <MultiSelectFilter
                                        label="Proyecto"
                                        icon={FolderKanban}
                                        options={flt.options.proyectos}
                                        selected={flt.proyecto}
                                        onChange={flt.setProyecto}
                                        placeholder="Uno o varios proyectos"
                                    />
                                </div>
                                <div>
                                    <MultiSelectFilter
                                        label="Sub Proyecto"
                                        icon={Target}
                                        options={flt.options.subProyectos}
                                        selected={flt.subProyecto}
                                        onChange={flt.setSubProyecto}
                                        placeholder="Uno o varios sub proy"
                                    />
                                </div>
                                <div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Search className="h-4 w-4 text-[#2b7fff]" />
                                            Búsqueda rápida
                                        </label>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={flt.searchSite}
                                                onChange={(e) => flt.setSearchSite(e.target.value)}
                                                placeholder="Código, sitio o nombre..."
                                                className="h-11 rounded-2xl border-slate-200 pl-9"
                                                aria-label="Búsqueda rápida"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </CardContent> */}
                        </Card>

                        {/* =================================================
                            TIMELINE + MACROPROCESO
                        ================================================= */}
                        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                            {/* TIMELINE */}
                            <MacroprocessTimeline
                                rows={filteredRows}
                                selected={selectedProcess}
                                onSelect={setSelectedProcess}
                            />
                            {/* CONTENIDO */}
                            <div className="min-w-0">
                                {selectedProcess === "implementacion" ? (
                                    <ImplementationView
                                        rows={filteredRows}
                                        currentDate={currentDate}
                                        metrics={metrics}
                                        activeDistributionRows={activeDistributionRows}
                                        providerMigrationData={providerMigrationData}
                                        providerTotals={providerTotals}
                                        distributionMode={distributionMode}
                                        setDistributionMode={setDistributionMode}
                                    />
                                ) : selectedProcess === "permisologia" ? (
                                    <PermisologiaView
                                        rows={filteredRows}
                                        currentDate={currentDate}
                                        metrics={metrics}
                                        activeDistributionRows={activeDistributionRows}
                                        distributionMode={distributionMode}
                                        setDistributionMode={setDistributionMode}
                                    />
                                ) : selectedProcess === "migrados" ? (
                                    <MigrationView
                                        rows={filteredRows}
                                        currentDate={currentDate}
                                        metrics={metrics}
                                        activeDistributionRows={activeDistributionRows}
                                        providerMigrationData={providerMigrationData}
                                        providerTotals={providerTotals}
                                        distributionMode={distributionMode}
                                        setDistributionMode={setDistributionMode}
                                    />
                                ) : selectedProcess === "ingenieria" ? (
                                    <IngView
                                        rows={filteredRows}
                                        dashboardYear={DASHBOARD_YEAR}
                                        // clusterData={clusterDataIng}
                                        currentDate={currentDate}
                                        metrics={metrics}
                                        // activeDistributionRows={activeDistributionRows}
                                        // providerMigrationData={providerMigrationData}
                                        // providerTotals={providerTotals}
                                        distributionMode={distributionMode}
                                        setDistributionMode={setDistributionMode}
                                    />
                                ) : selectedProcess === "entregables" ? (
                                    <EntregableView
                                        rows={filteredRows}
                                        dashboardYear={DASHBOARD_YEAR}
                                        // clusterData={clusterDataIng}
                                        currentDate={currentDate}
                                        metrics={metrics}
                                        // activeDistributionRows={activeDistributionRows}
                                        // providerMigrationData={providerMigrationData}
                                        // providerTotals={providerTotals}
                                        distributionMode={distributionMode}
                                        setDistributionMode={setDistributionMode}
                                    />
                                ) : selectedProcess === "pagados" ? (
                                    <PagadosView
                                        rows={filteredRows}
                                        currentDate={new Date()}
                                    />
                                ) : (
                                    <MacroprocessPlaceholder
                                        process={selectedProcessDefinition}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}