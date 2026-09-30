import { getForecast } from "@/services/budget/planning/getForecast";
import { postForecast } from "@/services/budget/planning/postForecast";
import { useEffect, useState } from "react"

export const useForecasts = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "codigo_proyecto",
    sortDirection = "asc",
    codigo_proyecto = "",
    nombre_proyecto = "",
    unidad_funcional = "",
    tipo = "",
    grupo = ""
}) => {

    const [forecast, setForecast] = useState([])
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
                    codigo_proyecto,
                    nombre_proyecto,
                    unidad_funcional,
                    tipo,
                    grupo
                };

                const res = await getForecast(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setForecast(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useForecasts:", err);
                setError(err);
                setForecast([]);
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
        codigo_proyecto,
        nombre_proyecto,
        unidad_funcional,
        tipo,
        grupo
    ])

    const addNewForecast = async (fd) => {
        try {
            const data = await postForecast(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        forecast,
        loading,
        totalResults,
        totalPages,
        error,
        addNewForecast,
    }
}