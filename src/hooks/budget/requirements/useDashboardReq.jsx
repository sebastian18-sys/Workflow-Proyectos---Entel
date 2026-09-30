import { getDashboardReq } from "@/services/budget/requirements/getDashboardReq";
import { useEffect, useState } from "react"

export const useDashboardReq = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "codigo_proyecto",
    sortDirection = "asc",
    unidad_funcional = "",
    id_proyecto = "",
    nombre_proyecto = "",
    estado = "",
    proveedor = "",
    acuerdo_compras = "",
    coordinador = ""
}) => {

    const [dashboardData, setDashboardData] = useState([]);
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
                    unidad_funcional,
                    id_proyecto,
                    nombre_proyecto,
                    estado,
                    proveedor,
                    acuerdo_compras,
                    coordinador
                };

                const res = await getDashboardReq(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setDashboardData(res?.content || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useForecasts:", err);
                setError(err);
                setDashboardData([]);
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
        unidad_funcional,
        id_proyecto,
        nombre_proyecto,
        estado,
        proveedor,
        acuerdo_compras,
        coordinador
    ])

    return {
        dashboardData,
        loading,
        totalResults,
        totalPages,
        error
    }
}