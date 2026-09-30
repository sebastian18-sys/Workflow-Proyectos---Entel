import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SimulationIllustration from "@/icons/SimulationIllustration";
import { formatCurrency, toNumber } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, FileSpreadsheet, GitBranch, RefreshCw, Settings2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const COLORS = [
    { label: "Primario", value: "#002EFF", className: "bg-brand-blue" },
    { label: "Alerta", value: "#FF3D00", className: "bg-brand-orange" },
    { label: "Éxito", value: "#43E7B4", className: "bg-brand-green" },
    { label: "Soporte", value: "#FD6C98", className: "bg-brand-pink" },
    { label: "Info", value: "#2FCBF1", className: "bg-brand-cyan" },
    { label: "Neutro", value: "#696969", className: "bg-brand-gray" }
];

const MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Setiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const PROJECT_TYPES = [
    { value: "Transporte", label: "Transporte", status: "demo" },
    { value: "Expansiones", label: "Expansiones", status: "pendiente" },
    { value: "Macros", label: "Macros", status: "pendiente" },
    { value: "Indoor", label: "Indoor", status: "pendiente" },
];

function buildMonthDistribution({ startMonth, duration, sites, amount }) {
    const startIndex = MONTHS.indexOf(startMonth);
    const monthsCount = Math.max(1, toNumber(duration));
    const siteBase = Math.floor(toNumber(sites) / monthsCount);
    const siteRemainder = toNumber(sites) % monthsCount;
    const amountBase = toNumber(amount) / monthsCount;

    return Array.from({ length: monthsCount }, (_, index) => {
        const monthIndex = (startIndex + index) % MONTHS.length;
        return {
            month: MONTHS[monthIndex],
            sites: siteBase + (index < siteRemainder ? 1 : 0),
            amount: Math.round(toNumber(amountBase) * 100) / 100,
        };
    });
}

function calculateBudget({ general, implementation, permits }) {

    const totalSites = toNumber(general.totalSites);
    const kilometraje = toNumber(implementation.kilometraje);
    const implementationDriver = kilometraje > 1200 ? 8000 : 5000;
    const implementationSites =
        toNumber(implementation.hab) + toNumber(implementation.fo) + toNumber(implementation.mw);

    const implementationAmount = implementationSites * implementationDriver;

    const permitsAmount =
        toNumber(permits.small) * 5000 +
        toNumber(permits.medium) * 6000 +
        toNumber(permits.large) * 7000;

    const permitsSites = toNumber(permits.small) + toNumber(permits.medium) + toNumber(permits.large);
    const permitsDriverAvg = permitsSites > 0 ? permitsAmount / permitsSites : 0;

    const lines = [
        {
            id: "implementation",
            type: general.type,
            project: general.projectName,
            process: "Implementación",
            investmentLine: "2-1-SERVICIO IMPLEMENTACION",
            driver: implementationDriver,
            sites: implementationSites,
            amount: implementationAmount,
            explanation:
                kilometraje > 1200
                ? "Kilometraje mayor a 1200, aplica driver alto."
                : "Kilometraje menor o igual a 1200, aplica driver base.",
            details: [
                { label: "HAB", quantity: toNumber(implementation.hab), driver: implementationDriver },
                { label: "FO", quantity: toNumber(implementation.fo), driver: implementationDriver },
                { label: "MW", quantity: toNumber(implementation.mw), driver: implementationDriver },
            ],
        },
        {
            id: "permits",
            type: general.type,
            project: general.projectName,
            process: "Permisos",
            investmentLine: "2-3-PERMISOS",
            driver: permitsDriverAvg,
            sites: permitsSites,
            amount: permitsAmount,
            explanation: "Driver promedio ponderado según distribución S, M y G.",
            details: [
                { label: "S", quantity: toNumber(permits.small), driver: 5000 },
                { label: "M", quantity: toNumber(permits.medium), driver: 6000 },
                { label: "G", quantity: toNumber(permits.large), driver: 7000 },
            ],
        },
    ];

    return {
        lines,
        totalSites,
        totalBudget: lines.reduce((acc, line) => acc + line.amount, 0),
        implementationDistribution: buildMonthDistribution({
            startMonth: general.startMonth,
            duration: general.duration,
            sites: implementationSites,
            amount: implementationAmount,
        }),
    };
}

function NumberInput({ value, onChange, min = 0, className }) {
    return (
        <Input
            type="number"
            min={min}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
            className={cn("font-semibold tabular-nums", className)}
        />
    );
}

function Field({ label, description, children }) {
    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground">{label}</Label>
            {children}
            {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
    );
}

function MetricCard({ label, value, helper, icon: Icon, tone = "blue" }) {

    const tones = {
        blue: "border-[#002EFF]/25 bg-[#002EFF]/10 text-[#002EFF]",
        cyan: "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan",
        green: "border-brand-green/25 bg-brand-green/10 text-brand-green",
        pink: "border-brand-pink/25 bg-brand-pink/10 text-brand-pink",
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
                {Icon ? (
                    <span className={cn("grid h-9 w-9 place-items-center rounded-xl border", tones[tone])}>
                        <Icon className="h-4 w-4" />
                    </span>
                ) : null}
            </div>
            <strong className="block text-2xl tracking-tight">{value}</strong>
            {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
        </div>
    );
}

function ResultMiniCard({ title, driver, sites, amount, icon: Icon }) {
    return (
        <div className="mt-5 rounded-2xl border border-[#43E7B4]/25 bg-[#43E7B4]/10 p-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-muted-foreground">{title}</p>
                    <strong className="mt-1 block text-2xl">{formatCurrency(amount)}</strong>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-200 p-3">
                    <span className="block text-muted-foreground">Driver</span>
                    <strong>{formatCurrency(driver)}</strong>
                </div>
                <div className="rounded-xl bg-gray-200 p-3">
                    <span className="block text-muted-foreground">Sitios</span>
                    <strong>{sites}</strong>
                </div>
            </div>
        </div>
    );
}

const BUDGET_STEPS = [
    {
        value: "datos",
        number: "01",
        title: "Datos",
        description: "Tipo, proyecto y periodo",
    },
    {
        value: "criterios",
        number: "02",
        title: "Criterios",
        description: "Procesos, reglas y drivers",
    },
    {
        value: "resumen",
        number: "03",
        title: "Resumen",
        description: "Líneas y presupuesto final",
    }
];

function StepHeader({ activeTab, setActiveTab }) {
    const currentStepIndex = Math.max(0, BUDGET_STEPS.findIndex((step) => step.value === activeTab));
    const progress = (currentStepIndex / (BUDGET_STEPS.length - 1)) * 100;

    return (
        <section className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-r from-brand-green/45 via-brand-cyan/25 to-brand-blue/35">
            <div className="rounded bg-white/95 p-5 text-slate-950 backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* <Badge className="w-fit border-brand-blue/20 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/10">
                        Paso {currentStepIndex + 1} de {BUDGET_STEPS.length}
                    </Badge> */}
                    </div>
                    <div className="relative grid gap-5 md:grid-cols-3 md:gap-8">
                    <div className="absolute left-[16.5%] right-[16.5%] top-8 hidden h-[3px] rounded-full bg-slate-200 md:block">
                        <div
                            className="h-full rounded-full bg-emerald-300 shadow-[0_0_28px_rgba(0,46,255,0.4)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {BUDGET_STEPS.map((step, index) => {
                        const isActive = activeTab === step.value;
                        const isCompleted = index < currentStepIndex;
                        const isPending = index > currentStepIndex;

                        return (
                            <button
                                key={step.value}
                                type="button"
                                onClick={() => setActiveTab(step.value)}
                                className="group relative z-10 flex items-center gap-4 rounded-3xl border border-transparent p-3 text-left transition-all duration-300 hover:bg-slate-50 md:flex-col md:items-center md:text-center"
                            >
                                <span
                                    className={cn(
                                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-xl font-black tabular-nums transition-all duration-300",
                                        isCompleted &&
                                            "border-emerald-400 bg-emerald-400 text-white shadow-[0_15px_40px_rgba(67,231,180,0.35)]",
                                        isActive &&
                                            "border-blue-400 bg-blue-400 text-white shadow-[0_18px_48px_rgba(0,46,255,0.36)]",
                                        isPending &&
                                            "border-slate-300 bg-white text-slate-400 group-hover:border-brand-cyan group-hover:text-blue-400"
                                    )}
                                >
                                    {isCompleted ? <CheckCircle2 className="h-8 w-8" /> : index + 1}
                                </span>

                                <span className="min-w-0">
                                    <span
                                        className={cn(
                                            "block text-base font-medium md:text-lg",
                                            isCompleted && "text-slate-800",
                                            isActive && "text-slate-800",
                                            isPending && "text-slate-800 group-hover:text-slate-950"
                                        )}
                                    >
                                        {index + 1}. {step.title}
                                    </span>
                                    <span
                                        className={cn(
                                            "mt-1 block text-sm font-semibold",
                                            isCompleted && "text-emerald-400",
                                            isActive && "text-blue-400",
                                            isPending && "text-slate-400"
                                        )}
                                    >
                                        {isCompleted ? "Completado" : isActive ? "En progreso" : "Pendiente"}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-slate-500">{step.description}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function GeneralStep({ general, setGeneral, setActiveTab }) {
    return (
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="mt-2 text-xl text-slate-600">Datos generales del presupuesto</CardTitle>
                            <CardDescription className="mt-2 max-w-2xl">
                                Define el tipo y datos base. Cada tipo de proyecto tiene reglas parametrizables según drivers.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Tipo de proyecto">
                        <Select value={general.type} onValueChange={(value) => setGeneral((prev) => ({ ...prev, type: value }))}>
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                            {PROJECT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Proyecto">
                        <Input
                            value={general.projectName}
                            onChange={(event) => setGeneral((prev) => ({ ...prev, projectName: event.target.value.toUpperCase() }))}
                            placeholder="CRA"
                            // className="h-11"
                        />
                    </Field>

                    <Field label="Año presupuesto">
                        <NumberInput value={general.year} min={2024} onChange={(value) => setGeneral((prev) => ({ ...prev, year: value }))} />
                    </Field>

                    <Field label="Cantidad base de sitios">
                        <NumberInput value={general.totalSites} onChange={(value) => setGeneral((prev) => ({ ...prev, totalSites: value }))} />
                    </Field>

                    <Field label="Mes inicial">
                        <Select value={general.startMonth} onValueChange={(value) => setGeneral((prev) => ({ ...prev, startMonth: value }))}>
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="Mes inicial" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((month) => (
                                    <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Duración">
                        <Select value={general.duration} onValueChange={(value) => setGeneral((prev) => ({ ...prev, duration: value }))}>
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="Duración" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((month) => (
                                    <SelectItem key={month} value={month}>{month} meses</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button className="bg-blue-500 text-white hover:bg-blue-700 cursor-pointer" onClick={() => setActiveTab("criterios")}>
                        Continuar a criterios <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
                </CardContent>
            </Card>

            <SimulationIllustration />

        </div>
    );
}

function CriteriaStep({ general, implementation, setImplementation, permits, setPermits, result, setActiveTab }) {
    const totalSites = toNumber(general.totalSites);
    const implementationSum = toNumber(implementation.hab) + toNumber(implementation.fo) + toNumber(implementation.mw);
    const permitSum = toNumber(permits.small) + toNumber(permits.medium) + toNumber(permits.large);
    const implementationProgress = totalSites > 0 ? Math.min(100, (implementationSum / totalSites) * 100) : 0;
    const permitProgress = totalSites > 0 ? Math.min(100, (permitSum / totalSites) * 100) : 0;

    return (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle className="mt-2 text-xl text-slate-600">Criterios por proceso</CardTitle>
                            <CardDescription className="mt-2">
                                Completa la distribución y el sistema calcula drivers, presupuesto y líneas automáticamente.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="multiple" defaultValue={["implementation", "permits"]} className="space-y-4">
                        <AccordionItem value="implementation" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5">
                            <AccordionTrigger>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-400 text-white">1</span>
                                    <span className="text-lg">Implementación</span>
                                    <Badge variant={implementationSum === totalSites ? "success" : "warning"}>
                                        {implementationSum}/{totalSites} sitios
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-5">
                                <div className="rounded-2xl border border-[#2FCBF1]/30 bg-[#2FCBF1]/10 p-4">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2FCBF1]">Regla activa</p>
                                    <p className="mt-1">Kilometraje &gt; 1200 = driver 8000, caso contrario driver 5000.</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-4">
                                    <Field label="HAB">
                                        <NumberInput value={implementation.hab} onChange={(value) => setImplementation((prev) => ({ ...prev, hab: value }))} />
                                    </Field>
                                    <Field label="FO">
                                        <NumberInput value={implementation.fo} onChange={(value) => setImplementation((prev) => ({ ...prev, fo: value }))} />
                                    </Field>
                                    <Field label="MW">
                                        <NumberInput value={implementation.mw} onChange={(value) => setImplementation((prev) => ({ ...prev, mw: value }))} />
                                    </Field>
                                    <Field label="Kilometraje">
                                        <NumberInput value={implementation.kilometraje} onChange={(value) => setImplementation((prev) => ({ ...prev, kilometraje: value }))} />
                                    </Field>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                        <span>Validación de sitios</span>
                                        <span>{implementationProgress.toFixed(0)}%</span>
                                    </div>
                                    <Progress className="w-full"  value={implementationProgress} />
                                    {/* {implementationSum !== totalSites ? (
                                        <p className="rounded-xl border border-[#FF3D00]/40 bg-[#FF3D00]/10 p-3 text-sm text-white">
                                            La distribución HAB + FO + MW debería coincidir con la cantidad base de sitios.
                                        </p>
                                    ) : null} */}
                                </div>

                                <ResultMiniCard title="Resultado implementación" driver={result.lines[0].driver} sites={result.lines[0].sites} amount={result.lines[0].amount} icon={Calculator} />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="permits" className="rounded-2xl border border-white/10 bg-white/[0.04] px-5">
                            <AccordionTrigger>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-400 text-white">2</span>
                                    <span className="text-lg">Permisos</span>
                                    <Badge variant={permitSum === totalSites ? "success" : "warning"}>
                                        {permitSum}/{totalSites} sitios
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-5">
                                <div className="rounded-2xl border border-[#2FCBF1]/30 bg-[#2FCBF1]/10 p-4">
                                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#2FCBF1]">Regla activa</p>
                                    <p className="mt-1 font-semibold">Permiso S = 5000, M = 6000 y G = 7000.</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <Field label="Permiso S">
                                        <NumberInput value={permits.small} onChange={(value) => setPermits((prev) => ({ ...prev, small: value }))} />
                                    </Field>
                                    <Field label="Permiso M">
                                        <NumberInput value={permits.medium} onChange={(value) => setPermits((prev) => ({ ...prev, medium: value }))} />
                                    </Field>
                                    <Field label="Permiso G">
                                        <NumberInput value={permits.large} onChange={(value) => setPermits((prev) => ({ ...prev, large: value }))} />
                                    </Field>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                        <span>Validación de sitios</span>
                                        <span>{permitProgress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={permitProgress} />
                                    {/* {permitSum !== totalSites ? (
                                        <p className="rounded-xl border border-brand-orange/40 bg-brand-orange/10 p-3 text-sm text-white">
                                        La distribución S + M + G debería coincidir con la cantidad base de sitios.
                                        </p>
                                    ) : null} */}
                                </div>

                                <ResultMiniCard title="Resultado permisos" driver={result.lines[1].driver} sites={result.lines[1].sites} amount={result.lines[1].amount} icon={FileSpreadsheet} />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button className="cursor-pointer" variant="secondary" onClick={() => setActiveTab("datos")}>Volver</Button>
                        <Button className="bg-blue-500 text-white hover:bg-blue-700 cursor-pointer" onClick={() => setActiveTab("resumen")}>Ver resumen calculado <ArrowRight className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <MetricCard label="Proyecto" value={`${general.type} / ${general.projectName}`} helper={`Año ${general.year}`} icon={GitBranch} tone="blue" />
                <MetricCard label="Presupuesto actual" value={formatCurrency(result.totalBudget)} helper="Suma de procesos calculados" icon={Sparkles} tone="blue" />
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-xl">Procesos pendientes</CardTitle>
                        <CardDescription>Simula la escalabilidad del motor cuando negocio defina más reglas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {["Reforzamiento", "Diseño", "Otros procesos"].map((process) => (
                        <div key={process} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3">
                            <span className="font-semibold">{process}</span>
                            <Badge variant="outline">Por definir</Badge>
                        </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function SummaryStep({ general, result, resetDemo, setActiveTab }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Tipo" value={general.type} helper="Programa seleccionado" icon={GitBranch} tone="blue" />
                <MetricCard label="Proyecto" value={general.projectName} helper="Ingresado por usuario" icon={Sparkles} tone="blue" />
                <MetricCard label="Año" value={general.year} helper={`${general.startMonth} · ${general.duration} meses`} icon={CheckCircle2} tone="blue" />
                <MetricCard label="Total" value={formatCurrency(result.totalBudget)} helper="Presupuesto calculado" icon={Calculator} tone="blue" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="mt-2 text-xl text-slate-600">Resumen de presupuesto generado</CardTitle>
                                <CardDescription className="mt-2">Tabla final similar a la figura inicial, con datos calculados automáticamente.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                <CardContent className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] border-collapse text-sm">
                                <thead className="bg-white/[0.05]">
                                    <tr className="text-left text-brand-pink">
                                        <th className="px-4 py-4 font-extrabold">Tipo</th>
                                        <th className="px-4 py-4 font-extrabold">Proyecto</th>
                                        <th className="px-4 py-4 font-extrabold">Línea inversión</th>
                                        <th className="numeric-cell px-4 py-4 font-extrabold">Driver</th>
                                        <th className="numeric-cell px-4 py-4 font-extrabold">Sitios</th>
                                        <th className="numeric-cell px-4 py-4 font-extrabold">Presupuesto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.lines.map((line) => (
                                        <tr key={line.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                                            <td className="px-4 py-4 font-semibold">{line.type}</td>
                                            <td className="px-4 py-4 font-semibold">{line.project}</td>
                                            <td className="px-4 py-4">
                                                <strong>{line.investmentLine}</strong>
                                            </td>
                                            <td className="numeric-cell px-4 py-4 tabular-nums">{formatCurrency(line.driver)}</td>
                                            <td className="numeric-cell px-4 py-4 tabular-nums">{line.sites}</td>
                                            <td className="numeric-cell px-4 py-4 font-semibold text-[#002EFF] tabular-nums">{formatCurrency(line.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t border-white/10 bg-brand-blue/10">
                                        <td colSpan="5" className="px-4 py-4 font-extrabold text-brand-cyan">Total</td>
                                        <td className="numeric-cell px-4 py-4 font-extrabold text-brand-cyan tabular-nums">{formatCurrency(result.totalBudget)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="secondary" onClick={() => setActiveTab("criterios")}>Editar criterios</Button>
                        <Button className="bg-blue-500 text-white hover:bg-blue-700 cursor-pointer">Guardar presupuesto</Button>
                    </div>
                </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="text-xl text-slate-500">Trazabilidad de reglas</CardTitle>
                            <CardDescription>Detalle de criterios utilizados para cada línea.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {result.lines.map((line) => (
                            <div key={line.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <strong>{line.process}</strong>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{line.explanation}</p>
                                    </div>
                                    <Badge variant="info">Driver: {formatCurrency(line.driver)}</Badge>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {line.details.map((item) => (
                                    <div key={item.label} className="rounded-xl bg-[#002EFF]/20 p-3 text-center">
                                        <span className="block text-xs font-black text-[#002EFF]">{item.label}</span>
                                        <strong className="block text-lg">{item.quantity}</strong>
                                        <small className="text-[11px] text-muted-foreground">{formatCurrency(item.driver)}</small>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-xl text-slate-500">Mensualización</CardTitle>
                                    <CardDescription>Implementación desde {general.startMonth}.</CardDescription>
                                </div>
                                <Badge variant="info">{general.duration} meses</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                        {result.implementationDistribution.map((row) => (
                            <div key={row.month} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
                                <span className="font-bold">{row.month}</span>
                                <div className="bg-[#43E7B4]/90 p-1 rounded-full">
                                <span className="text-white font-medium">{row.sites} sitios</span>
                                </div>
                                <span className="text-muted-foreground tabular-nums">{formatCurrency(row.amount)}</span>
                            </div>
                        ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


export default function Estimations() {

    const [activeTab, setActiveTab] = useState("datos");
    const [general, setGeneral] = useState({
        type: "Transporte",
        projectName: "CRA",
        year: "2027",
        totalSites: "800",
        startMonth: "Febrero",
        duration: "5",
    });
    const [implementation, setImplementation] = useState({
        hab: "500",
        fo: "200",
        mw: "100",
        kilometraje: "1300",
    });
    const [permits, setPermits] = useState({
        small: "300",
        medium: "300",
        large: "200",
    });

    const result = useMemo(
        () => calculateBudget({ general, implementation, permits }),
        [general, implementation, permits]
    );

    const resetDemo = () => {
        setActiveTab("datos");
        setGeneral({
            type: "Transporte",
            projectName: "CRA",
            year: "2027",
            totalSites: "800",
            startMonth: "Febrero",
            duration: "5"
        });
        setImplementation({ hab: "500", fo: "200", mw: "100", kilometraje: "1300" });
        setPermits({ small: "300", medium: "300", large: "200" });
    };

    return (
        <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Estimaciones</h2>
                </div>

                 {/* Main */}
                <div>
                    <StepHeader activeTab={activeTab} setActiveTab={setActiveTab} />
                    <div className="relative">
                        <div className="rounded-2xl bg-white p-8 relative">
                            <div className="relative">
                                <div className="relative min-h-44">
                                    <div className="contain-inline-size">

                                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                                            <TabsContent value="datos" className="mt-0">
                                                <GeneralStep general={general} setGeneral={setGeneral} setActiveTab={setActiveTab} />
                                            </TabsContent>
                                            <TabsContent value="criterios" className="mt-0">
                                                <CriteriaStep
                                                    general={general}
                                                    implementation={implementation}
                                                    setImplementation={setImplementation}
                                                    permits={permits}
                                                    setPermits={setPermits}
                                                    result={result}
                                                    setActiveTab={setActiveTab}
                                                />
                                            </TabsContent>
                                            <TabsContent value="resumen" className="mt-0">
                                                <SummaryStep general={general} result={result} resetDemo={resetDemo} setActiveTab={setActiveTab} />
                                            </TabsContent>
                                        </Tabs>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}