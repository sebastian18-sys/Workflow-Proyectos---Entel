// PRIORIDAD RUTAS
export const BUDGET_LANDING = [
	{ path: "/budget/capex/dashboard", perm: "CAPEX_DASHBOARD_READ" },
	{ path: "/budget/capex/execution", perm: "CAPEX_EXECUTION_READ" },
	{ path: "/budget/opex/dashboard", perm: "OPEX_DASHBOARD_READ" },
	{ path: "/budget/analytics/tickets", perm: "REQUERIMIENTO_TICKETS_READ" }
];

// DASHBOARD COLOR FCST
export const COLORS_FCST = {
	"Plan": "#43E7B4",
	"1+11": "#FD6C98",
	"2+10": "#2FCBF1",
	"3+9": "#696969",
	"4+8": "#43E7B4",
	"5+7": "#FD6C98",
	"6+6": "#2FCBF1",
	"7+5": "#696969",
	"8+4": "#43E7B4",
	"9+3": "#FD6C98",
	"10+2": "#2FCBF1",
	"11+1": "#696969",
}

export const KEY_FCST = {
	"Plan": "plan",
	"1+11": "fcst_1_11",
	"2+10": "fcst_2_10",
	"3+9": "fcst_3_9",
	"4+8": "fcst_4_8",
	"5+7": "fcst_5_7",
	"6+6": "fcst_6_6",
	"7+5": "fcst_7_5",
	"8+4": "fcst_8_4",
	"9+3": "fcst_9_3",
	"10+2": "fcst_10_2",
	"11+1": "fcst_11_1",
}