import { useEffect, useMemo, useState } from "react"
import { getDeliverables } from "@/services/capex/getDeliverables"
import { postDeliverables } from "@/services/capex/postDeliverables"
import { putDeliverableAproved, putDeliverableObserved, putDeliverableReturn, putDeliverables, putDeliverableToCancelled } from "@/services/capex/putDeliverables"

export const useDeliverables = ({
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
    assigned_to_email = "",
    proveedor = "",
    type_code = "",
    type_name = "",
}) => {

    const [deliverable, setDeliverable] = useState([])
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
                    assigned_to_email,
                    proveedor,
                    type_code,
                    type_name,
                };

                const res = await getDeliverables(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setDeliverable(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setDeliverable([]);
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
        assigned_to_email,
        proveedor,
        type_code,
        type_name,
    ])

    const addDeliverables = async (fd) => {
        try {
            const data = await postDeliverables(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateDeliverables = async (id, fd) => {
        try {
            const data = await putDeliverables(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateDeliverableStateApproved = async (id, fd) => {
        try {
            const data = await putDeliverableAproved(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateDeliverableStateObserved = async (id, fd) => {
        try {
            const data = await putDeliverableObserved(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateDeliverableStateReturn = async (id, fd) => {
        try {
            const data = await putDeliverableReturn(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateDeliverableStateCancelled = async (id, fd) => {
        try {
            const data = await putDeliverableToCancelled(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        deliverable,
        loading,
        totalResults,
        totalPages,
        error,
        addDeliverables,
        updateDeliverables,
        updateDeliverableStateApproved,
        updateDeliverableStateObserved,
        updateDeliverableStateReturn,
        updateDeliverableStateCancelled
    }
}