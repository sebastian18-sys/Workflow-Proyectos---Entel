import { useEffect, useMemo, useState } from "react"
import { postOpex } from "@/services/capex/postOpex"
import { getAllOpex } from "@/services/capex/getAllOpex"

export const useOpex = (filtros = {}) => {

    const [opex, setOpex] = useState([])

    useEffect(() => {
        getAllOpex().then(res => {
            setOpex(res.content)
        })
    }, [])

    const addData = async (fd) => {
        try {
            const data = await postOpex(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    return {
        opex,
        addData,
    }
}