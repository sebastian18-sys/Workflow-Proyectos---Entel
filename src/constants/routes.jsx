import { lazy } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import { _nav_budget, _nav_projects } from './_nav';
import DashboardOpex from '@/views/budget/opex/Dashboard';
import UploadOpex from '@/views/budget/opex/UploadOpex';
import { PERMS } from './perm';
// import Forecasts from '@/views/budget/capex/Forecasts';
// import DeliverableInbox from '@/views/budget/analytics/DeliverableInbox';
// import DeliverableHistory from '@/views/budget/analytics/DeliverableHistory';
// import SettlementInbox from '@/views/budget/analytics/SettlementInbox';
// import SettlementHistory from '@/views/budget/analytics/SettlementHistory';
// import Deliverable from '@/views/budget/analytics/Deliverable';
// import DeliverableDetails from '@/views/budget/analytics/DeliverableDetails';

const LoginPage = lazy(() => import('@/views/pages/login/Login'))
const Forbidden = lazy(() => import('@/views/pages/403/Forbidden'))
const NotFound = lazy(() => import('@/views/pages/404/NotFound'))
const PrincipalPage = lazy(() => import('@/views/pages/principal/Principal'))

const BudgetLanding = lazy(() => import('@/components/Landing/BudgetLanding'))

const DashboardCapex = lazy(() => import('@/views/budget/capex/Dashboard'))
const ExecutionBudget = lazy(() => import('@/views/budget/capex/Execution'))
const CompliancePM = lazy(() => import('@/views/budget/capex/Compliance-pm'))
const ComplianceLeadership = lazy(() => import('@/views/budget/capex/Compliance-leadership'))
const ComplianceUF = lazy(() => import('@/views/budget/capex/Compliance-uf'))
const RQHistorical = lazy(() => import('@/views/budget/capex/rq-historical'))
const CRDetails = lazy(() => import('@/views/budget/capex/cr-details'))
// const Forecasts = lazy(() => import('@/views/budget/capex/Forecasts'))
// const Scenarios = lazy(() => import('@/views/budget/opex/Scenarios'))
const Estimaciones = lazy(() => import('@/views/budget/opex/Estimaciones'))
const Upload = lazy(() => import('@/views/budget/capex/Upload'))
const Layout = lazy(() => import('@/components/Layout/Layout'))
const RentasOpex = lazy(() => import('@/views/budget/opex/RentasOpex'))

const DashboardReq = lazy(() => import('@/views/budget/analytics/DashboardReq'))
const Summary = lazy(() => import('@/views/budget/analytics/Summary'))
const Tickets = lazy(() => import('@/views/budget/analytics/Tickets'))
const TicketDetails = lazy(() => import('@/views/budget/analytics/TicketDetails'))
const TicketSites = lazy(() => import('@/views/budget/analytics/TicketSites'))
const PaymentsHistory = lazy(() => import('@/views/budget/analytics/PaymentsHistory'))
const PaymentsDetails = lazy(() => import('@/views/budget/analytics/PaymentsDetails'))
const PaymentsSites = lazy(() => import('@/views/budget/analytics/PaymentsSites'))
const Settlement = lazy(() => import('@/views/budget/analytics/Settlement'))
const SettlementHistory = lazy(() => import('@/views/budget/analytics/SettlementHistory'))
const SettlementInbox = lazy(() => import('@/views/budget/analytics/SettlementInbox'))
const SettlementDetails = lazy(() => import('@/views/budget/analytics/SettlementDetails'))
const Deliverable = lazy(() => import('@/views/budget/analytics/Deliverable'))
const DeliverableInbox = lazy(() => import('@/views/budget/analytics/DeliverableInbox'))
const DeliverableHistory = lazy(() => import('@/views/budget/analytics/DeliverableHistory'))
const DeliverableDetails = lazy(() => import('@/views/budget/analytics/DeliverableDetails'))
const Validations = lazy(() => import('@/views/budget/analytics/Validations'))
const PAProveedor = lazy(() => import('@/views/budget/analytics/PAProveedor'))
const UploadAnalytics = lazy(() => import('@/views/budget/analytics/UploadAnalytics'))

const SummaryFcst = lazy(() => import('@/views/budget/planning/SummaryFcst'))
const Forecasts = lazy(() => import('@/views/budget/planning/Forecasts'))
const DraftFcst = lazy(() => import('@/views/budget/planning/DraftFcst'))
const Estimations = lazy(() => import('@/views/budget/planning/Estimations'))
const Drivers = lazy(() => import('@/views/budget/planning/Drivers'))
const Template = lazy(() => import('@/views/budget/planning/Template'))

const Dashboard = lazy(() => import('@/views/projects/Dashboard'))
const Projects = lazy(() => import('@/views/projects/Projects'))
const MyProjects = lazy(() => import('@/views/projects/MyProjects'))
const DetailProjects = lazy(() => import('@/views/projects/DetailProjects'))
const InitiativeProjects = lazy(() => import('@/views/projects/InitiativeProjects'))
const Identifiers = lazy(() => import('@/views/projects/Identifiers'))

const Inbox = lazy(() => import('@/views/projects/Inbox'))
const InboxMonthly = lazy(() => import('@/views/projects/InboxMonthly'))
const InboxHistory = lazy(() => import('@/views/projects/InboxHistory'))
const SiteDetails = lazy(() => import('@/views/projects/SiteDetails'))

const TrackingSummary = lazy(() => import('@/views/projects/TrackingSummary'))
const Tracking = lazy(() => import('@/views/projects/Tracking'))
const TrackingFlow = lazy(() => import('@/views/projects/TrackingFlow'))
const TrackingMonthly = lazy(() => import('@/views/projects/TrackingMonthly'))
const TrackingStandby = lazy(() => import('@/views/projects/TrackingStandby'))

const CompleteMassive = lazy(() => import('@/views/projects/CompleteMassive'))

const Workflows = lazy(() => import('@/views/projects/templates/Workflows'))
const WorkflowDetail = lazy(() => import('@/views/projects/templates/WorkflowDetail'))
const Task = lazy(() => import('@/views/projects/templates/Task'))
const TaskDetail = lazy(() => import('@/views/projects/templates/TaskDetail'))

const UploadSites = lazy(() => import('@/views/projects/templates/UploadSites'))

const DashboardTx = lazy(() => import('@/views/projects/DashboardTx'))
const DashboardTxProcess = lazy(() => import('@/views/projects/DashboardTxProcess'))

export const routes = [ 
    { path: '/login', name: 'Login', element: <LoginPage /> },
    { path: "*", name: '404', element: <NotFound /> },
    { path: '/403', name: '403', element: <Forbidden /> },
    { path: '/home', name: 'Home', element: <ProtectedRoute><PrincipalPage /></ProtectedRoute> },
    {
        path: "/budget",
        element: <ProtectedRoute><Layout title="Presupuesto GCIR" module="Presupuesto" sidebar={_nav_budget} /></ProtectedRoute>,
        children: [
            { index: true, element: <BudgetLanding /> },
            { path: "capex/dashboard", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_DASHBOARD_READ}><DashboardCapex /></ProtectedRoute> },
            { path: "capex/execution", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_EXECUTION_READ}><ExecutionBudget /></ProtectedRoute> },
            { path: "capex/pm", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_PM_READ}><CompliancePM /></ProtectedRoute> },
            { path: "capex/leadership", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_LEADERSHIP_READ}><ComplianceLeadership /></ProtectedRoute> },
            { path: "capex/compliance-uf", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_LEADERSHIP_READ}><ComplianceUF /></ProtectedRoute> },
            { path: "capex/rq", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_RQ_READ}><RQHistorical /></ProtectedRoute> },
            { path: "capex/cr", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_CR_READ}><CRDetails /></ProtectedRoute> },
            { path: "capex/forecasts", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><Forecasts /></ProtectedRoute> },
            { path: "capex/upload", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_UPLOAD_READ}><Upload /></ProtectedRoute> },
            
            { path: "opex/dashboard", element: <ProtectedRoute perm={PERMS.BUDGET.OPEX_DASHBOARD_READ}><DashboardOpex /></ProtectedRoute> },
            // { path: "opex/scenarios", element: <ProtectedRoute perm={PERMS.BUDGET.OPEX_SCENARIOS_READ}><Scenarios /></ProtectedRoute> },
            { path: "opex/scenarios", element: <ProtectedRoute perm={PERMS.BUDGET.OPEX_SCENARIOS_READ}><Estimaciones /></ProtectedRoute> },
            { path: "opex/leases", element: <ProtectedRoute perm={PERMS.BUDGET.OPEX_LEASES_READ}><RentasOpex /></ProtectedRoute> },
            { path: "opex/upload", element: <ProtectedRoute perm={PERMS.BUDGET.OPEX_UPLOAD_READ}><UploadOpex /></ProtectedRoute> },
            { path: "analytics/dashboard", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_DASHBOARD_REQ_READ}><DashboardReq /></ProtectedRoute> },
            { path: "analytics/summary", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_SUMMARY_READ}><Summary /></ProtectedRoute> },
            { path: "analytics/tickets", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ}><Tickets /></ProtectedRoute> },
            { path: "analytics/tickets/:id", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ}><TicketDetails /></ProtectedRoute> },
            { path: "analytics/details", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ}><TicketSites /></ProtectedRoute> },
            { path: "analytics/payments", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ}><PaymentsHistory /></ProtectedRoute> },
            { path: "analytics/payments/:id", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ}><PaymentsDetails /></ProtectedRoute> },
            { path: "analytics/payments-sites", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ}><PaymentsSites /></ProtectedRoute> },
            { path: "analytics/validations", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ}><Validations /></ProtectedRoute> },
            // { path: "analytics/settlement", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ}><Settlement /></ProtectedRoute> },
            { path: "analytics/settlement", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ}><SettlementInbox /></ProtectedRoute> },
            { path: "analytics/settlement/history", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ}><SettlementHistory /></ProtectedRoute> },
            { path: "analytics/settlement/:id", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_SETTLEMENTS_READ}><SettlementDetails /></ProtectedRoute> },
            // { path: "analytics/deliverables", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PAYMENTS_READ}><Deliverable /></ProtectedRoute> },
            { path: "analytics/deliverables", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_DELIVERABLES_READ}><DeliverableInbox /></ProtectedRoute> },
            { path: "analytics/deliverables/history", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_DELIVERABLES_READ}><DeliverableHistory /></ProtectedRoute> },
            { path: "analytics/deliverables/:id", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_DELIVERABLES_READ}><DeliverableDetails /></ProtectedRoute> },
            { path: "analytics/pa", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_PA_READ}><PAProveedor /></ProtectedRoute> },
            { path: "analytics/upload", element: <ProtectedRoute perm={PERMS.BUDGET.REQUERIMIENTO_TICKETS_READ}><UploadAnalytics /></ProtectedRoute> },
            { path: "planning/forecasts/summary", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><SummaryFcst /></ProtectedRoute> },
            { path: "planning/forecasts/details", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><Forecasts /></ProtectedRoute> },
            { path: "planning/forecasts/draft", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><DraftFcst /></ProtectedRoute> },
            { path: "planning/estimation", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><Estimations /></ProtectedRoute> },
            { path: "planning/drivers", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><Drivers /></ProtectedRoute> },
            { path: "planning/template", element: <ProtectedRoute perm={PERMS.BUDGET.CAPEX_FORECASTS_READ}><Template /></ProtectedRoute> },
            { path: "*", element: <NotFound /> }
        ]
    },
    {
        path: "/projects",
        element: <ProtectedRoute><Layout title="Proyectos GCIR" module="Gestion de Proyectos" sidebar={_nav_projects} /></ProtectedRoute>,
        children: [
            { index: true },
            { path: "dashboard", element: <DashboardTx /> },
            { path: "dashboard/process", element: <DashboardTxProcess /> },
            { path: "history", element: <Projects /> },
            { path: "history/:id", element: <DetailProjects /> },
            { path: "me", element: <MyProjects /> },
            { path: "initiative", element: <InitiativeProjects /> },
            { path: "identifiers", element: <Identifiers /> },
            { path: "inbox", element: <Inbox /> },
            { path: "inbox/monthly", element: <InboxMonthly /> },
            { path: "inbox/history", element: <InboxHistory /> },
            { path: "sites/:instanceId", element: <SiteDetails /> },
            { path: "tracking/summary", element: <TrackingSummary /> },
            { path: "tracking", element: <Tracking /> },
            { path: "tracking/flow", element: <TrackingFlow /> },
            { path: "tracking/monthly", element: <TrackingMonthly /> },
            { path: "tracking/standby", element: <TrackingStandby /> },
            { path: "sites/massive", element: <CompleteMassive /> },
            { path: "templates/workflows", element: <Workflows /> },
            { path: "templates/workflows/:id", element: <WorkflowDetail /> },
            { path: "templates/tasks", element: <Task /> },
            { path: "templates/tasks/:id", element: <TaskDetail /> },
            { path: "upload-sites", element: <UploadSites /> },
            { path: "*", element: <NotFound /> }
        ],
    }   
];