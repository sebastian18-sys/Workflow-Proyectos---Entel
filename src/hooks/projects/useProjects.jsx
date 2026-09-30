import { getAllProjects } from "@/services/projects/getAllProjects"
import { getProjectInfoById } from "@/services/projects/getProjectInfoById"
import { useEffect, useState } from "react"


export const useProjects = (id) => {

    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(false)
    // const [loadingId, ]
    const [projectById, setProjectById] = useState({})
    const user = JSON.parse(window.localStorage.getItem("loggedUser"))
    let tokenUser = user.token

    useEffect(() => {

        setLoading(true)

        getAllProjects(tokenUser).then(res => {
            setProjects(res)
        }).finally(() => {
            setLoading(false)
        })

    }, [])

    useEffect(() => {

        setLoading(true)

        getProjectInfoById(id, tokenUser).then(res => {
            setProjectById(res)
        }).finally(() => {
            setLoading(false)
        })
    }, [])

    // useEffect(() => {
    //     if (projects.length > 0) {
    //         setProjectById(projects.find(project => project.codigo === id))
    //     }
    // }, [projects])

    return {
        projects,
        projectById
    } 
}