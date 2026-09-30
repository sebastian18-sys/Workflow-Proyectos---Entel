import { getDownloadAll, getDownloadCrFile, getDownloadDeliverable, getDownloadFile } from "@/services/capex/getDownloadFile"
import { useEffect, useMemo, useState } from "react"

export const useDownloadFile = (filtros = {}) => {

    const [file, setFile] = useState([])
    const [loadingDownload, setLoadingDownload] = useState(false)

    const params = useMemo(() => filtros ?? {}, [JSON.stringify(filtros ?? {})])

    // useEffect(() => {
        
    //     const controller = new AbortController()

    //     setLoading(true);

    //     getDownloadFile(params, { signal: controller.signal })
    //         .then(res => {
    //             setFile(res.content.items)
    //         })
    //         .finally(() => setLoading(false))
    //     return () => controller.abort()
    // }, [params])

    const download = async (name) => {

        params.name = name

        console.log("PARAMS", params)

        try {
            const data = await getDownloadFile(params)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const downloadAllSustentos = async (name) => {

        params.name = name
        params.allSustentos = true

        console.log("PARAMS", params)

        try {
            setLoadingDownload(true);
            const data = await getDownloadAll(params)
            setLoadingDownload(false);
            return data
        } catch (error) {
            console.log(error)
        }
    }


    const downloadCR = async (name) => {

        params.name = name

        console.log("PARAMS", params)

        try {
            const data = await getDownloadCrFile(params)
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const downloadDeliverables = async (name) => {

        params.name = name

        console.log("PARAMS", params)

        try {
            const data = await getDownloadDeliverable(params)
            return data
        } catch (error) {
            console.log(error)
        }
    }


    return {
        download,
        downloadAllSustentos,
        downloadCR,
        downloadDeliverables,
        loadingDownload
    }
}