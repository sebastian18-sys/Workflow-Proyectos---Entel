import { useEffect, useMemo, useState } from "react"
import { getSettlements } from "@/services/capex/getSettlements"
import { putSettlementAproved, putSettlementObserved, putSettlementReturn, putSettlements, putSettlementToCancelled } from "@/services/capex/putSettlements"
import { postSettlements } from "@/services/capex/postSettlement"

export const useSettlements = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "code",
    sortDirection = "asc",
    code = "",
    name = "",
    estado = "",
    requester = "",
    requester_email = "",
    assigned_to = "",
    proveedor = ""
}) => {

    const [settlement, setSettlement] = useState([])
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
                    estado,
                    requester,
                    requester_email,
                    assigned_to,
                    proveedor,
                };

                const res = await getSettlements(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setSettlement(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setSettlement([]);
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
        estado,
        requester,
        requester_email,
        assigned_to,
        proveedor,
    ])


    const addSettlements = async (fd) => {
        try {
            const data = await postSettlements(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateSettlements = async (fd) => {
        try {
            const data = await putSettlements(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateApproved = async (id, fd) => {
        try {
            const data = await putSettlementAproved(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateObserved = async (id, fd) => {
        try {
            const data = await putSettlementObserved(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateReturn = async (id, fd) => {
        try {
            const data = await putSettlementReturn(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateCancelled = async (id, fd) => {
        try {
            const data = await putSettlementToCancelled(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        settlement,
        loading,
        totalResults,
        totalPages,
        error,
        addSettlements,
        updateSettlements,
        updateStateApproved,
        updateStateObserved,
        updateStateReturn,
        updateStateCancelled
    }
}