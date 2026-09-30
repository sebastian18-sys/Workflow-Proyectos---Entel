import { apiPython } from "../lib/axios"

export const getAuthzMe = async (id) => {
    // const config = {
    //     headers: {
    //         Authorization: `Bearer ${token}`
    //     }
    // }
    
	try {
		const auhz = await apiPython.get(`/auth/me/${id}`)
		return auhz.data.content
	} catch (error) {
		console.log(error)
	}
}