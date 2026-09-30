import { useEffect, useMemo, useState } from "react"
import { getPayments } from "@/services/capex/getPayments";
import { postPayments } from "@/services/capex/postPayments";
import { putPayGenerated, putPayGeneratedH2, putPayGenValidate, putPayToCancelled, putPayToClose, putPayToSendMg, putPayToSendMgH2 } from "@/services/capex/putPayments";

export const usePayments = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "code",
    sortDirection = "desc",
    code = "",
    name = "",
    state = "",
    requester = "",
    requester_email = "",
    ticket_jira = "",
    status_hito = "",
    currentStage = ""
}) => {

    const [payments, setPayments] = useState([]);
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
                    state,
                    requester,
                    requester_email,
                    ticket_jira,
                    status_hito,
                    currentStage
                };

                const res = await getPayments(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setPayments(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useOCbyProy:", err);
                setError(err);
                setPayments([]);
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
        state,
        requester,
        requester_email,
        ticket_jira,
        status_hito,
        currentStage
    ])

    const addPayments = async (fd) => {
        try {
            const data = await postPayments(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    // const updatePaymentsSites = async (id, fd) => {
    //     try {
    //         const data = await putPayments(id, fd)
    //         return data
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    const updateStatePaySendMg = async (id, fd) => {
        try {
            const data = await putPayToSendMg(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePayGenerated = async (id, fd) => {
        try {
            const data = await putPayGenerated(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePaySendMgH2 = async (id, fd) => {
        try {
            const data = await putPayToSendMgH2(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePayGeneratedH2 = async (id, fd) => {
        try {
            const data = await putPayGeneratedH2(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePayGenValidate = async (id, fd) => {
        try {
            const data = await putPayGenValidate(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateValidateSendMg = async (id, fd) => {
        try {
            const data = await putValidateSendMg(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePayCancelled = async (id, fd) => {
        try {
            const data = await putPayToCancelled(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePayClose = async (id, fd) => {
        try {
            const data = await putPayToClose(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        payments,
        loading,
        totalResults,
        totalPages,
        error,
        addPayments,
        // updatePaymentsSites,
        updateStatePaySendMg,
        updateStatePayGenerated,
        updateStatePaySendMgH2,
        updateStatePayGeneratedH2,
        updateStatePayGenValidate,
        updateStateValidateSendMg,
        updateStatePayCancelled,
        updateStatePayClose
    }
}