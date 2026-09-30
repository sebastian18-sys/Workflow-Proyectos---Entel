import { api } from "../../lib/axios"

export const getAllRqProvider = () => {
    return api.get("/providers/budget/rq-agrupado-proveedores").then(res => res.data)
}