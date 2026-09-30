import { getRQbyProy } from "@/services/capex/getAllRq"
import { useEffect, useState } from "react"
// import { getAllRq } from "@/services/capex/getAllRq"
// import { getAllRq } from "@/services/capex/getAllRq"

export const useRQbyProy = (cod) => {

    const [rqProy, setRqProy] = useState([])

    useEffect(() => {

        if (!cod) return;

        getRQbyProy(cod).then(res => {
            setRqProy(res.content)
        })
    }, [cod])

    return rqProy
}