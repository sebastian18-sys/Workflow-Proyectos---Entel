import { useEffect, useState } from "react"
import { getAllProjectsCapex } from "../../../services/capex/getAllProjectsCapex"

export const useProjectsCapex = () => {

    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {

        setLoading(true);

        getAllProjectsCapex()
            .then(res => {
                setProjects(res.content)
            })
            .finally(() => setLoading(false))
    }, [])

    return {
        projects,
        loading
    }
}