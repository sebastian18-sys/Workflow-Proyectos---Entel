// import { getSummaryByKey } from "@/services/capex/getSummaryByKey"
import { getAllPa } from "@/services/capex/getAllPa"
import { useEffect, useState } from "react"
// import { getProvisionesCapex } from "@/services/capex/getProvisionesCapex"

export const usePa = () => {

    const [pa, setPa] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLoading(true);
        getAllPa().then(res => {
            setPa(res.content)
        }).finally(() => setLoading(false))
    }, [])

    return {
        pa,
        loading
    }
}