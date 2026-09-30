import { getAllTicketsSites } from "@/services/capex/getTicketSites"
import { putTicketsSites } from "@/services/capex/putTickets"
import { useEffect, useMemo, useState } from "react"

export const useTicketSites = (filtros = {}) => {

    const [ticketSites, setTicketSites] = useState([])
    const [loading, setLoading] = useState(false)

    const params = useMemo(() => filtros ?? {}, [JSON.stringify(filtros ?? {})])

    useEffect(() => {
            
        const controller = new AbortController()

        setLoading(true);

        getAllTicketsSites(params, { signal: controller.signal })
            .then(res => {
                setTicketSites(res.content.items)
            })
            .finally(() => setLoading(false))
        return () => controller.abort()
    }, [params])


    const updateTicketsSites = async (id, fd) => {
        try {
            const data = await putTicketsSites(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }
    

    return {
        ticketSites,
        updateTicketsSites,
        loading
    }
}