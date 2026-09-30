import { api, apiPython } from "../../lib/axios"

export const getAllRq = () => {
    return api.get("/providers/budget/rq-agrupado").then(res => res.data)
}

export const getRqTable = (params = {}, config = {}) => {

    return api
        .get("/providers/budget/rq-agrupado-q", {
            ...config,
            params,
        })
        .then(res => res.data)
}

export const getRQbyProy = async (cod) => {

  	return api.get(`/providers/budget/get-rq/oc-by-project`, {
		params: {
			codigos: cod
		}
	}).then(res => res.data)
}
