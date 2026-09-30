import { api, apiPython } from "../../lib/axios"

export const postUploadData = async (fd, token) => {

    // const config = {
    //     headers: {
    //         headers: { "Content-Type": "multipart/form-data" },
    //         Authorization: `Bearer ${token}`,
    //         onUploadProgress: (e) => {
    //             console.log(e)
    //         }
    //     }
    // }

    // console.log("CONFIG", config)

    console.log("SERVICE POST UPLOAD DATA", fd)
    for (const [k, v] of fd.entries()) {
        console.log(k, v instanceof File ? `${v.name} (${v.size} bytes)` : v)
    }

    const result = await apiPython.post("/capex/upload-data-capex", fd, {
        headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
        },
        onUploadProgress: (e) => {
            console.log(e)
        }
    })
 
    return result.data
}