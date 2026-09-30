import { getSummaryByKey } from "@/services/capex/getSummaryByKey"
import { useEffect, useState } from "react"
// import { getProvisionesCapex } from "@/services/capex/getProvisionesCapex"

export const useSummaryKey = () => {

    const [summaryKey, setSummaryKey] = useState([])

    useEffect(() => {
        getSummaryByKey().then(res => {
            setSummaryKey(res.content)
        })
    }, [])

    return summaryKey
}