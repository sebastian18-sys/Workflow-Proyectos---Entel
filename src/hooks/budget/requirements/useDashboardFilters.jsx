import { getDashboardReqFilters } from "@/services/budget/requirements/getDashboardReqFilters";
import { useEffect, useState } from "react";

function buildQueryString(params = {}) {

	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {

		if (value == null || value === "") continue;

		if (Array.isArray(value)) {
			value.forEach((item) => {
				if (item != null && item !== "") {
					searchParams.append(key, item);
				}
			});
			continue;
		}
		searchParams.append(key, value);
	}
	return searchParams.toString();
}

export const useDashboardFilters = (filters) => {

    const [dashboardFilters, setDashboardFilters] = useState([])
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController()
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = buildQueryString(filters)

                const res = await getDashboardReqFilters(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setDashboardFilters(res?.content || []);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useForecasts:", err);
                setError(err);
                setDashboardFilters([]);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => controller.abort();
    }, [filters])

    return {
		options: dashboardFilters ?? {
			unidadFuncionales: [],
			codigosProyecto: [],
			proyectos: [],
			estados: [],
            coordinadores: [],
			proveedores: [],
			acuerdos: [],
		},
		loading,
	};
}