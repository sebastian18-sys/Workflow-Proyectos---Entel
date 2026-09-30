import { execScenarios } from "@/services/capex/execScenarios"
import { useEffect, useState } from "react"


export const useScenarios = () => {

  const [scenarios, setScenarios] = useState([])

  useEffect(() => {
    execScenarios().then(res => {
      setScenarios(res.content)
    })
  }, [])

  return scenarios
}