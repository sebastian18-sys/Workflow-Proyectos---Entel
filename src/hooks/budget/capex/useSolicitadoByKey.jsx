import { getSolicitadoByKey } from "@/services/capex/getSolicitadoByKey"
import { useEffect, useState } from "react"

export const useSolicitadoByKey = () => {

    const [solicitadoKey, setSolicitadoKey] = useState([])

    useEffect(() => {
        getSolicitadoByKey().then(res => {
            setSolicitadoKey(res.content)
        })
    }, [])

    return solicitadoKey
}