import { useEffect, useState } from "react"
import { getProvisionesCapex } from "@/services/capex/getProvisionesCapex"
import { getAverageWeekReq } from "@/services/capex/getAverageWeekReq"

export const useProvisionesCapex = ({
    page = 1,
    limit = 20000,
    unidad_funcional = "",
    nombre_proyecto = "",
}) => {

    const [provisiones, setProvisiones] = useState([])
    const [averageReq, setAverageReq] = useState([])
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getProvisionesCapex().then(res => {
            setProvisiones(res.content)
        })
    }, [])

    // useEffect(() => {
    //     getAverageWeekReq().then(res => {
    //         setAverageReq(res.content)
    //     })
    // }, [])

    useEffect(() => {
                    
        const controller = new AbortController()

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = {
                    page,
                    limit,
                    unidad_funcional,
                    nombre_proyecto
                };

                const res = await getAverageWeekReq(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setAverageReq(res?.content || []);
                // setTotalResults(res?.content?.totalResults || 0);
                // setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setAverageReq([]);
                // setTotalResults(0);
                // setTotalPages(0);
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
        unidad_funcional,
        nombre_proyecto
    ])

    return {
        provisiones,
        averageReq
    }
}