import { useEffect, useState } from "react"
import { getProjectsOpex } from "@/services/capex/getProjectsOpex"

export const useProjectsOpex = () => {

  const [opex, setOpex] = useState([])

  useEffect(() => {
    getProjectsOpex().then(res => {
      setOpex(res.data)
    })
  }, [])

  return opex
}