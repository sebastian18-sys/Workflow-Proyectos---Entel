
import { getAllContracts, getContractsTable } from "@/services/capex/getAllContracts"
import { useEffect, useMemo, useState } from "react"

// export const useContracts = (filtros = {}) => {

//     const [contracts, setContracts] = useState([])
//     const [loading, setLoading] = useState(false)

//     const params = useMemo(() => filtros ?? {}, [JSON.stringify(filtros ?? {})])

//     useEffect(() => {

//         const controller = new AbortController()
//         setLoading(true);

//         getAllContracts(params, { signal: controller.signal })
//             .then(res => {
//                 setContracts(res.content)
//             })
//             .finally(() => setLoading(false))

//         return () => controller.abort()
//     }, [params])

//     return contracts
// }

export const useContracts = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "ticket_code",
    sortDirection = "asc",
    area = "",
    status_final = ""
}) => {

    const [contracts, setContracts] = useState([])
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
                    area,
                    status_final
                };

                const res = await getContractsTable(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setContracts(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useContracts:", err);
                setError(err);
                setContracts([]);
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
        area,
        status_final
    ])

    return {
        contracts,
        loading,
        totalResults,
        totalPages,
        error
    }
}