import { useEffect, useState } from "react"
import { getAllRqProvider } from "@/services/capex/getAllRqProvider"

export const useRQProvider = () => {

    const [rqProvider, setRqProvider] = useState([])

    useEffect(() => {
        getAllRqProvider().then(res => {
            setRqProvider(res.content)
        })
    }, [])

    return rqProvider
}