import {
  LayoutDashboard,
  TrendingUp,
  FileCheck,
  CheckSquare,
  DollarSign,
  Upload,
  Briefcase,
  FolderKanban,
  PanelsTopLeft,
  FolderOpenDot,
  ChartBar,
  ChartNoAxesCombined,
  FileChartColumn,
  LayoutList,
  ChartGantt,
  Check,
  LayoutTemplate,
  Workflow,
  ClipboardList,
  SquareCheck,
  ChartCandlestick,
  Columns4,
  User,
  BanknoteArrowUp,
  MapPinned,
  CheckCheck,
  ShieldCheck,
  FileStack,
  Target,
  HandCoins,
  PackageCheck,
  FileText,
  Percent,
  Presentation,
  BookTemplate,
  UploadIcon,
  TrainTrack,
  CheckCircle2,
  Notebook
} from "lucide-react"
import { PERMS } from "./perm"

export const _nav_budget = [
    {
        _tag: 'ChevronDown',
		id: "capex",
        label: 'CAPEX',
        path: '#',
        icon: Briefcase,
        perm: PERMS.BUDGET.CAPEX_MODULE_ACCESS,
        _children: [
            {
                _tag: '',
				id: "capex-dashboard",
                label: 'Dashboard',
                path: '/budget/capex/dashboard',
				icon: LayoutDashboard,
                perm: PERMS.BUDGET.CAPEX_DASHBOARD_READ,
            },
            {
                _tag: '',
                id: "ejecucion",
				label: "Ejecución presupuestal",
				path: "/budget/capex/execution",
				icon: TrendingUp,
                perm: PERMS.BUDGET.CAPEX_EXECUTION_READ,
            },
            // {
            //     _tag: '',
            //     id: "compromisos-pm",
			// 	label: "Cumplimiento PM",
			// 	path: "/budget/capex/pm",
			// 	icon: Target,
            //     perm: PERMS.BUDGET.CAPEX_PM_READ,
            // },
			{
                _tag: '',
                id: "cumplimiento-jefatura",
				label: "Cumplimiento UF",
				path: "/budget/capex/leadership",
				icon: Target,
                perm: PERMS.BUDGET.CAPEX_LEADERSHIP_READ,
            },
            {
                _tag: '',
                id: "rq-grouped",
				label: "RQ Histórico",
				path: "/budget/capex/rq",
				icon: CheckSquare,
                perm: PERMS.BUDGET.CAPEX_RQ_READ,
            },
            {
                _tag: '',
                id: "cr-details",
				label: "CR Detalles",
				path: "/budget/capex/cr",
				icon: CheckSquare,
                perm: PERMS.BUDGET.CAPEX_CR_READ,
            },
            // {
            //     _tag: '',
            //     id: "forecasts-drivers",
            //     label: "Pronósticos",
            //     path: "/budget/capex/forecasts",
            //     icon: Target,
            //     perm: PERMS.BUDGET.CAPEX_FORECASTS_READ,
            // },
            {
                 _tag: '',
                id: "carga",
                label: "Carga de Datos",
                path: "/budget/capex/upload",
                icon: Upload,
                perm: PERMS.BUDGET.CAPEX_UPLOAD_READ,
                _children: []
            }
        ],
    },
	{
        _tag: 'ChevronDown',
		id: "opex",
        label: 'OPEX',
        path: '#',
        icon: DollarSign,
        perm: PERMS.BUDGET.OPEX_MODULE_ACCESS,
        _children: [
            {
				_tag: '',
				id: "opex-dashboard",
				label: "Dashboard",
				path: "opex/dashboard",
				icon: LayoutDashboard,
                perm: PERMS.BUDGET.OPEX_DASHBOARD_READ,
			},
			{
				_tag: '',
				id: "opex-escenarios",
				label: "Escenarios",
				path: "opex/scenarios",
				icon: TrendingUp,
                perm: PERMS.BUDGET.OPEX_SCENARIOS_READ,
			},
            {
				_tag: '',
				id: "opex-projects",
				label: "Arriendos OPEX",
				path: "opex/leases",
				icon: TrendingUp,
                perm: PERMS.BUDGET.OPEX_LEASES_READ,
			},
            {
                _tag: '',
                id: "opex-upload",
                label: "Carga",
                path: "opex/upload",
                icon: Upload,
                perm: PERMS.BUDGET.OPEX_UPLOAD_READ,
                _children: []
            }
        ],
    },
    {
        _tag: 'ChevronDown',
		id: "requerimiento",
        label: 'Requerimiento',
        path: '#',
        icon: ChartCandlestick,
        perm: PERMS.BUDGET.REQUERIMIENTO_MODULE_ACCESS,
        _children: [
			// {
			// 	_tag: '',
			// 	id: "analytics-summary",
			// 	label: "Resumen",
			// 	path: "analytics/summary",
			// 	icon: FileChartColumn,
            //     perm: PERMS.BUDGET.REQUERIMIENTO_SUMMARY_READ,
			// },
            {
                _tag: '',
				id: "analytics-dashboard",
                label: 'Dashboard',
                path: 'analytics/dashboard',
				icon: LayoutDashboard,
                perm: PERMS.BUDGET.REQUERIMIENTO_DASHBOARD_REQ_READ,
            },
            {
				_tag: '',
				id: "analytics-tickets",
				label: "Tickets RQ",
				path: "analytics/tickets",
				icon: Columns4,
                perm: PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ,
			},
            {
				_tag: '',
				id: "analytics-payments",
				label: "Control de Pagos",
				path: "analytics/payments",
				icon: BanknoteArrowUp,
                perm: PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ,
			},
            {
                _tag: '',
                id: "analytics-settlement",
                label: "Liquidaciones",
                path: "analytics/settlement",
                icon: HandCoins,
                perm: PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ,
            },
            {
                _tag: '',
                id: "analytics-deliverables",
                label: "Entregables",
                path: "analytics/deliverables",
                icon: PackageCheck,
                perm: PERMS.BUDGET.REQUERIMIENTO_DELIVERABLES_READ,
            },
            {
                _tag: '',
                id: "analytics-pa",
                label: "PA",
                path: "analytics/pa",
                icon: User,
                // perm: PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ,
            }
        ],
    },
    {
        _tag: 'ChevronDown',
        id: "planificacion",
        label: 'Planificación',
        path: '#',
        icon: Presentation,
        perm: PERMS.BUDGET.CAPEX_FORECASTS_READ,
        _children: [
            {
                _tag: '',
                id: "forecasts",
                label: "Forecasts",
                path: "planning/forecasts/summary",
                icon: ChartNoAxesCombined,
                perm: PERMS.BUDGET.CAPEX_FORECASTS_READ,
            },
            {
                _tag: '',
                id: "estimation",
                label: "Estimaciones",
                path: "planning/estimation",
                icon: TrendingUp,
                perm: PERMS.BUDGET.CAPEX_FORECASTS_READ,
            },
            {
                _tag: '',
                id: "drivers",
                label: "Drivers",
                path: "planning/drivers",
                icon: Percent,
                perm: PERMS.BUDGET.CAPEX_FORECASTS_READ,
            },
            {
                _tag: '',
                id: "template",
                label: "Plantilla",
                path: "planning/template",
                icon: BookTemplate,
                perm: PERMS.BUDGET.CAPEX_FORECASTS_READ,
            }
        ]
    }
]

export const _nav_projects = [
    {
        _tag: '',
        id: "dashboard",
		label: "Dashboard",
		path: "/projects/dashboard",
		icon: LayoutDashboard,
        _children: []
    },
    // {
    //     _tag: 'ChevronDown',
	// 	id: "proyectos",
    //     label: 'Proyectos',
    //     path: '#',
    //     icon: FolderKanban,
    //     _children: [
    //         {
    //             _tag: '',
	// 			id: "proyectos-historial",
    //             label: 'Historial',
    //             path: '/projects/history',
	// 			icon: PanelsTopLeft,
    //         },
    //         {
    //             _tag: '',
    //             id: "proyectos-me",
	// 			label: "Mis Proyectos",
	// 			path: "/projects/me",
	// 			icon: FolderOpenDot,
    //         },
    //         {
    //             _tag: '',
    //             id: "proyectos-iniciativa",
	// 			label: "Iniciativa",
	// 			path: "/projects/initiative",
	// 			icon: ChartBar,
    //         },
    //         {
    //             _tag: '',
    //             id: "proyectos-ejecucion",
	// 			label: "Ejecución",
	// 			path: "/projects/execution",
	// 			icon: ChartNoAxesCombined,
    //         },
    //         {
    //             _tag: '',
    //             id: "proyectos-cierre",
	// 			label: "Cierre",
	// 			path: "/projects/closure",
	// 			icon: FileChartColumn,
    //         }
    //     ],
    // },
    // {
    //     _tag: 'ChevronDown',
	// 	id: "sitios",
    //     label: 'Sitios',
    //     path: '#',
    //     icon: MapPinned,
    //     _children: [
    //         {
    //             _tag: '',
	// 			id: "sites-total",
    //             label: 'Total Sitios',
    //             path: '/projects/sites/total',
	// 			icon: PanelsTopLeft,
    //         },
    //         {
    //             _tag: '',
    //             id: "sites-me",
	// 			label: "Mis Sitios",
	// 			path: "/projects/sites/me",
	// 			icon: PanelsTopLeft,
    //         },
    //     ],
    // },
    
    
    ,
    // {
    //     _tag: '',
    //     id: "gantt",
	// 	label: "Gantt",
	// 	path: "/projects/gantt",
	// 	icon: ChartGantt,
    //     _children: []
    // },
    // {
    //     _tag: '',
    //     id: "validaciones",
	// 	label: "Validaciones",
	// 	path: "/projects/validations",
	// 	icon: CheckCheck,
    //     _children: []
    // },
    {
        _tag: 'ChevronDown',
		id: "inbox",
        label: 'Mis Tareas',
        path: '',
        icon: LayoutTemplate,
        _children: [
            {
                _tag: '',
                id: "inbox",
				label: "Mi bandeja",
				path: "/projects/inbox",
				icon: ChartGantt,
            },
            {
                _tag: '',
                id: "sites-massive",
				label: "Completado Masivo",
				path: "/projects/sites/massive",
				icon: CheckCircle2,
            }
        ],
    },
    // {
    //     _tag: '',
    //     id: "inbox",
	// 	label: "Mi bandeja",
	// 	path: "/projects/inbox",
	// 	icon: ChartGantt,
    //     _children: []
    // },
    // {
    //     _tag: '',
    //     id: "sites-massive",
	// 	label: "Completado Masivo",
	// 	path: "/projects/sites/massive",
	// 	icon: CheckCircle2,
    //     _children: []
    // },

    {
        _tag: 'ChevronDown',
		id: "tracking-all",
        label: 'Tracking',
        path: '',
        icon: TrainTrack,
        _children: [
            {
                _tag: '',
                id: "tracking-summary",
				label: "Resumen",
				path: "/projects/tracking/summary",
				icon: Notebook,
            },
            {
                _tag: '',
                id: "tracking-site",
				label: "Tracking",
				path: "/projects/tracking",
				icon: TrainTrack,
            },
            
        ],
    },

    {
        _tag: 'ChevronDown',
		id: "sites-all",
        label: 'Sitios',
        path: '',
        icon: MapPinned,
        _children: [
            {
                _tag: '',
                id: "identificadores",
				label: "Identificadores",
				path: "/projects/identifiers",
				icon: LayoutList,
            },
            {
                _tag: '',
                id: "site-summary",
				label: "Vista Resumen",
				path: "/projects/sites/total",
				icon: MapPinned,
            },
            
        ],
    },

    // {
    //     _tag: '',
    //     id: "tracking",
	// 	label: "Tracking",
	// 	path: "/projects/tracking",
	// 	icon: TrainTrack,
    //     _children: []
    // },
    // {
    //     _tag: '',
    //     id: "identificadores",
	// 	label: "Identificadores",
	// 	path: "/projects/identifiers",
	// 	icon: LayoutList,
    //     _children: []
    // },
    // {
    //     _tag: '',
    //     id: "sites-total",
	// 	label: "Sitios",
	// 	path: "/projects/sites/total",
	// 	icon: MapPinned,
    //     _children: []
    // },
    {
        _tag: '',
        id: "update-sites",
		label: "Carga de Sitios",
		path: "/projects/upload-sites",
		icon: UploadIcon,
        _children: []
    },
    {
        _tag: 'ChevronDown',
		id: "plantillas",
        label: 'Plantillas',
        path: '',
        icon: LayoutTemplate,
        _children: [
            // {
            //     _tag: '',
			// 	id: "plantillas-formularios",
            //     label: 'Fomularios',
            //     path: '/projects/templates/forms',
			// 	icon: FileStack,
            // },
            {
                _tag: '',
                id: "plantillas-workflows",
				label: "Workflows",
				path: "/projects/templates/workflows",
				icon: Workflow,
            },
            {
                _tag: '',
                id: "plantillas-tareas",
				label: "Tareas",
				path: "/projects/templates/tasks",
				icon: ClipboardList,
            }
        ],
    }
    // {
    //     _tag: 'ChevronDown',
	// 	id: "adherencia",
    //     label: 'Adherencia',
    //     path: '#',
    //     icon: ShieldCheck,
    //     _children: [
    //         {
    //             _tag: '',
	// 			id: "adherencia-resumen",
    //             label: 'Resumen',
    //             path: '/projects/adherence/summary',
	// 			icon: PanelsTopLeft,
    //         },
    //         {
    //             _tag: '',
    //             id: "adherencia-cumplimiento",
	// 			label: "Cumplimiento",
	// 			path: "/projects/adherence/compliance",
	// 			icon: SquareCheck,
    //         },
    //     ],
    // }
]