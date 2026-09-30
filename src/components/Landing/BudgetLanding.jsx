import { Navigate } from "react-router-dom";
import { useAuthz } from "@/hooks/useAuthz";
import AppLoading from "../AppLoading/AppLoading";
import { BUDGET_LANDING } from "@/constants/constants";

export default function BudgetLanding() {
    const { loading, can } = useAuthz();

    if (loading) return <AppLoading />;

    const firstAllowed = BUDGET_LANDING.find((x) => can(x.perm));

    if (!firstAllowed) {
        return <Navigate to="/403" replace />;
    }

    return <Navigate to={firstAllowed.path} replace />;
}