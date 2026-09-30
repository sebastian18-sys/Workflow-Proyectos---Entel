import { postScenarios } from "@/services/capex/postScenarios"
import { useEffect, useState } from "react"

export const useScenariosData = () => {

    const [loading, setLoading] = useState(false)
    const [resultData, setResultData] = useState(null)
    const [showResults, setShowResults] = useState(false)

    const scenariosData = async (fd) => {
        try {
            const data = await postScenarios(fd)
            return data
        } catch (error) {
            console.log(error)
        }
    }
    
    return {
        loading,
        resultData,
        setResultData,
        showResults,
        setShowResults,
        setLoading,
        scenariosData
    }
    
}