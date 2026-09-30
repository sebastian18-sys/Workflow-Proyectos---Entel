
import { getSummaryByPa } from "@/services/capex/getSummaryByPa"
import { useEffect, useState } from "react"
// import { getProvisionesCapex } from "@/services/capex/getProvisionesCapex"

export const useSummaryByPa = () => {

    const [summaryPa, setSummaryPa] = useState([])

    useEffect(() => {
        getSummaryByPa().then(res => {
            setSummaryPa(res.content)
        })
    }, [])

    return summaryPa
}