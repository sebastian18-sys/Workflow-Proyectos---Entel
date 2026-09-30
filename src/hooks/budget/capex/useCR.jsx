import { useEffect, useState } from "react"
import { getAllCr, getCrTable } from "@/services/capex/getAllCr"

// export const useCR = () => {

//     const [cr, setCr] = useState([])

//     useEffect(() => {
//         getAllCr().then(res => {
//             setCr(res.content)
//         })
//     }, [])

//     return cr
// }

export const useCR = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "ticket_code",
    sortDirection = "asc",
    estado_oc = "",
    proveedor = "",
    pm_actual = "",
    requisitor = ""
}) => {

    const [cr, setCr] = useState([])
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
                    estado_oc,
                    proveedor,
                    pm_actual,
                    requisitor
                };

                const res = await getCrTable(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setCr(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setCr([]);
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
        estado_oc,
        proveedor,
        pm_actual,
        requisitor
    ])

    return {
        cr,
        loading,
        totalResults,
        totalPages,
        error
    }
}