import { getAllUsers } from "../../services/admin/users/getAllUsers"
import { useAuth } from "../useAuth"
import { useEffect, useState } from "react"


export const useUsers = () => {

    const { token } = useAuth()

    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState([])

    const user = JSON.parse(window.localStorage.getItem("loggedUser"))
    let tokenUser = user.token

    useEffect(() => {

        setLoading(true)

        getAllUsers(tokenUser)
            .then(res => {
                setUsers(res)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    return {
        users,
        loading
    } 
}