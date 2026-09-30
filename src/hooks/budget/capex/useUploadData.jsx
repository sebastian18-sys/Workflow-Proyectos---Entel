import { postUploadData } from "@/services/capex/postUploadData"
import { useEffect, useState } from "react"

export const useUploadData = () => {

    const user = JSON.parse(window.localStorage.getItem("loggedUser"))
    let tokenUser = user.token

    const uploadData = async (fd) => {
        try {
            const data = await postUploadData(fd, tokenUser)
            return data
        } catch (error) {
            console.log(error)
        }
    }
    
    return {
        uploadData
    }
    
}