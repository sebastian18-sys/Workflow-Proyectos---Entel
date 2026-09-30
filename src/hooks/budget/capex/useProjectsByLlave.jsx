import { useEffect, useState } from "react"
import { getAllProjectsByLlaveCapex } from "../../../services/capex/getAllProjectsCapex"

export const useProjectsByLlaveCapex = () => {

    const [projectsByKey, setProjectsByKey] = useState([])

    useEffect(() => {
        getAllProjectsByLlaveCapex().then(res => {
            setProjectsByKey(res.content)
        })
    }, [])

    return projectsByKey
}