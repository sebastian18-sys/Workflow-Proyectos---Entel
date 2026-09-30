import { getCRbyOC } from "@/services/capex/getAllCr";
import { useEffect, useState } from "react"

export const useCRbyOC = (oc) => {

    const [ocLine, setOcLine] = useState([])

    useEffect(() => {

        if (!oc) return;

        getCRbyOC(oc).then(res => {
            setOcLine(res.content)
        })
    }, [oc])

    return ocLine
}