import { getResponsibleUsers } from "@/services/admin/users/getResponsibleUsers"
import { useAuth } from "../useAuth"
import { useEffect, useState } from "react"


export const useResponsibleUsers = () => {

    const [loading, setLoading] = useState(false)
    const [groupUsers, setGroupUsers] = useState([])

    const user = JSON.parse(window.localStorage.getItem("loggedUser"))
    let tokenUser = user.token

    useEffect(() => {

        setLoading(true)

        getResponsibleUsers(tokenUser)
            .then(res => {
                setGroupUsers(res)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    return {
        groupUsers,
        loading
    } 
}