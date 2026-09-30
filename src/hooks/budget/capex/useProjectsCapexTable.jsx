import { getProjectsCapex } from "@/services/capex/getAllProjectsCapex";
import { useEffect, useMemo, useState } from "react"

export const useProjectsCapexTable = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "ticket_code",
    sortDirection = "asc",
    tipo = "",
    jefatura = "",
    pm = "",
    requisitor = "",
    categoria = ""
}) => {

    const [projectsT, setProjectsT] = useState([])
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
                    tipo,
                    jefatura,
                    pm,
                    requisitor,
                    categoria
                };

                const res = await getProjectsCapex(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setProjectsT(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useProjects:", err);
                setError(err);
                setProjectsT([]);
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
        tipo,
        jefatura,
        pm,
        requisitor,
        categoria
    ])

    return {
        projectsT,
        loading,
        totalResults,
        totalPages,
        error
    }
}