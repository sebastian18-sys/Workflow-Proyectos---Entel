import { useEffect, useState } from "react"
import { getAllTickets } from "../../../services/capex/getTickets"
import { postTickets } from "@/services/capex/postTickets"
import { putTickets, putToCancelled, putToObserved, putToObservedFromMg, putToPending, putToSendMg, putToSendRq } from "@/services/capex/putTickets"

export const useTickets = ({
    page = 1,
    limit = 10,
    search = "",
    sortBy = "ticket_code",
    sortDirection = "asc",
    ticket_code = "",
    requester = "",
    requester_email = "",
    state = ""
}) => {

    const [tickets, setTickets] = useState([])
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
                    ticket_code,
                    requester,
                    requester_email,
                    state
                };

                const res = await getAllTickets(params, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setTickets(res?.content?.items || []);
                setTotalResults(res?.content?.totalResults || 0);
                setTotalPages(res?.content?.totalPages || 0);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error("Error useTickets:", err);
                setError(err);
                setTickets([]);
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
        ticket_code,
        requester,
        requester_email,
        state
    ])


    const addTickets = async (fd) => {
        try {
            const data = await postTickets(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }


    const updateTickets = async (id, fd) => {
        try {
            const data = await putTickets(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateSendMg = async (id, fd) => {
        try {
            const data = await putToSendMg(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateObserved = async (id, fd) => {
        try {
            const data = await putToObserved(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateObservedFromMg = async (id, fd) => {
        try {
            const data = await putToObservedFromMg(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStatePending = async (id, fd) => {
        try {
            const data = await putToPending(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateSendRq = async (id, fd) => {
        try {
            const data = await putToSendRq(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateStateCancelled = async (id, fd) => {
        try {
            const data = await putToCancelled(id, fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    
    return {
        tickets,
        loading,
        totalResults,
        totalPages,
        error,
        addTickets,
        updateTickets,
        updateStateSendMg,
        updateStateObserved,
        updateStateObservedFromMg,
        updateStatePending,
        updateStateSendRq,        
        updateStateCancelled
    }
}