import { useEffect, useState } from "react"
import { getAllRq, getRqTable } from "@/services/capex/getAllRq"
// import { getAllRq } from "@/services/capex/getAllRq"

// export const useRQ = () => {

//     const [rq, setRq] = useState([])

//     useEffect(() => {
//         getAllRq().then(res => {
//             setRq(res.content)
//         })
//     }, [])

//     return rq
// }

export const useRQ = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "ticket_code",
    sortDirection = "asc",
    estado_oc = "",
    tipo = "",
    categoria = "",
    proveedor = "",
    requisitor = "",
    pm_actual = "",
    jefatura = "",
    gerencia = ""
}) => {

    const [rq, setRq] = useState([])
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
                    tipo,
                    categoria,
                    proveedor,
                    requisitor,
                    pm_actual,
                    jefatura,
                    gerencia
                };

                const res = await getRqTable(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setRq(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setRq([]);
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
        tipo,
        categoria,
        proveedor,
        requisitor,
        pm_actual,
        jefatura,
        gerencia
    ])

    return {
        rq,
        loading,
        totalResults,
        totalPages,
        error
    }
}