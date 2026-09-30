import { getOCbyProjects } from "@/services/capex/getOCbyProjects"
import { putTicketSitesAssignTo } from "@/services/capex/putTickets";
import { useEffect, useMemo, useState } from "react"

export const useOCbyProy = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "ticket_code",
    sortDirection = "asc",
    jefatura = "",
    unidad_funcional = "",
    id_proyecto = "",
    nombre_proyecto = "",
    estado = "",
    proveedor = "",
    ticket_code = "",
    linea_inversion = "",
    identificador = "",
    acuerdo_compras = "",
    is_payment = "",
    requester = "",
    requester_email = "",
    assigned_to_email = "",
    coordinador = "",
    status_settlement = "",
    status_deliverable = "",
    exclude_status_settlement = false,
    enabled = true
}) => {

    const [ocSites, setOcSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (!enabled) return
            
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
                    jefatura,
                    unidad_funcional,
                    id_proyecto,
                    linea_inversion,
                    nombre_proyecto,
                    estado,
                    proveedor,
                    identificador,
                    acuerdo_compras,
                    ticket_code,
                    is_payment,
                    requester,
                    requester_email,
                    assigned_to_email,
                    coordinador,
                    status_settlement,
                    status_deliverable,
                    exclude_status_settlement
                };

                const res = await getOCbyProjects(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setOcSites(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useOCbyProy:", err);
                setError(err);
                setOcSites([]);
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
        jefatura,
        unidad_funcional,
        id_proyecto,
        nombre_proyecto,
        estado,
        proveedor,
        ticket_code,
        linea_inversion,
        identificador,
        acuerdo_compras,
        is_payment,
        requester,
        requester_email,
        assigned_to_email,
        coordinador,
        status_settlement,
        status_deliverable,
        exclude_status_settlement,
        enabled
    ])

    const updateAssignTo = async (fd) => {
        try {
            const data = await putTicketSitesAssignTo(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        ocSites,
        loading,
        totalResults,
        totalPages,
        error,
        updateAssignTo
    }
}