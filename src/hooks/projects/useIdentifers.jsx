import { postIdentifers } from "@/services/projects/postIdentifers"
import { useAuth } from "../useAuth"
import { getIdentifiers } from "@/services/projects/getIdentifers"
import { useEffect, useState } from "react"
import { putIdentifiers } from "@/services/projects/putIdentifiers"


export const useIdentifers = () => {

    const { token } = useAuth()

    const [loading, setLoading] = useState(false)
    const [identifiers, setIdentifiers] = useState([])

    useEffect(() => {

        setLoading(true)

        getIdentifiers()
            .then(res => {
                setIdentifiers(res)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    const postData = async (fd) => {
        try {
            const data = await postIdentifers(fd, token)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateData = async (fd) => {
        try {
            const data = await putIdentifiers(fd, token)
            return data
        } catch (error) {
            console.log(error)
        }
    }
    

    return {
        identifiers,
        postData,
        updateData
    } 
}