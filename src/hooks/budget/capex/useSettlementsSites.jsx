import { useEffect, useMemo, useState } from "react"
import { getAllTickets } from "../../../services/capex/getTickets"
import { getSettlementsSites } from "@/services/capex/getSettlementsSites";

export const useSettlementsSites = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "code",
    sortDirection = "asc",
    code = "",
    name = "",
    requester = "",
    requester_email = "",
    assigned_to = "",
    id_proyecto = "",
    nombre_proyecto = "",
    linea_inversion = "",
    actividad = "",
    estado = ""
}) => {

    const [settlementSite, setSettlementSite] = useState([])
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
                
        const controller = new AbortController()

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    page,
                    limit,
                    search,
                    sortBy,
                    sortDirection,
                    code,
                    name,
                    requester,
                    requester_email,
                    assigned_to,
                    id_proyecto,
                    nombre_proyecto,
                    linea_inversion,
                    actividad,
                    estado,
                };

                const res = await getSettlementsSites(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setSettlementSite(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setSettlementSite([]);
                setTotalResults(0);
                setTotalPages(0);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => controller.abort();

    }, [
        page,
        limit,
        search,
        sortBy,
        sortDirection,
        code,
        name,
        requester,
        requester_email,
        assigned_to,
        id_proyecto,
        nombre_proyecto,
        linea_inversion,
        actividad,
        estado
    ])

    return {
        settlementSite,
        loading,
        totalResults,
        totalPages,
        error,
        // addTickets,
        // updateTickets,
        // updateStateSendMg,
        // updateStateObserved,
        // updateStateObservedFromMg,
        // updateStatePending,
        // updateStateSendRq,        
        // updateStateCancelled
    }
}