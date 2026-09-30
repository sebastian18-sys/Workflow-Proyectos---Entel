import { useEffect, useMemo, useState } from "react"
import { getDeliverables } from "@/services/capex/getDeliverables"
import { postDeliverables } from "@/services/capex/postDeliverables"
import { putDeliverableAproved, putDeliverableObserved, putDeliverableReturn, putDeliverableToCancelled } from "@/services/capex/putDeliverables"
import { getTypeDeliverableFields } from "@/services/capex/getDeliverableFields"

export const useDeliverablesFields = ({
    limit = 100,
    code = ""
}) => {

    const [deliverableFields, setDeliverableFields] = useState([])
    const [loadingFields, setLoadingFields] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
                
        const controller = new AbortController()

        const loadData = async () => {
            try {
                setLoadingFields(true);
                setError(null);

                const params = {
                    limit,
                    code,
                };

                const res = await getTypeDeliverableFields(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setDeliverableFields(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setDeliverableFields([]);
                setTotalResults(0);
                setTotalPages(0);
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingFields(false);
                }
            }
        };

        loadData();

        return () => controller.abort();

    }, [
        limit,
        code
    ])

    return {
        deliverableFields,
        loadingFields,
        totalResults,
        totalPages,
        error
    }
}