import { getTypeDeliverable } from "@/services/capex/getTypeDeliverable"
import { useEffect, useState } from "react"

export const useTypeDeliverable = () => {

    const [typeDeliverable, setTypeDeliverable] = useState([])

    useEffect(() => {
        getTypeDeliverable().then(res => {
            setTypeDeliverable(res.content)
        })
    }, [])

    return typeDeliverable
}