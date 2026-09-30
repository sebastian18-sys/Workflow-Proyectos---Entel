import { useEffect, useMemo, useState } from "react"
import { getPaymentsSites } from "@/services/capex/getPaymentsSites";
import { putPaymentsSites } from "@/services/capex/putPayments";

export const usePaymentsSites = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "code",
    sortDirection = "desc",
    code = "",
    requester = "",
    requester_email = "",
    ticket_jira = "",
    estado = ""
}) => {

    const [paymentsSites, setPaymentsSites] = useState([]);
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
                    requester,
                    requester_email,
                    ticket_jira,
                    estado
                };

                const res = await getPaymentsSites(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setPaymentsSites(res?.content?.items || []);
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
        requester,
        requester_email,
        ticket_jira,
        estado
    ])

    const updatePaymentsSites = async (id, fd) => {
        try {
            const data = await putPaymentsSites(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        paymentsSites,
        loading,
        totalResults,
        totalPages,
        error,
        updatePaymentsSites
    }
}