import { api } from "../../../../lib/axios"

export const getBulkCompletion = async(params = {}) => {
    const query = {
        ...params,
        column_filters:
            Object.keys(params.column_filters || {}).length
                ? JSON.stringify(params.column_filters)
                : undefined
    }

    const result = await api.get(
        "/projects/bulk/bulk-completion",
        { params: query }
    )

    return result.data
}

export const getBulkCompletionOptions = (params = {}, config = {}) =>
    api.get(`/projects/bulk/bulk-completion/filter-options`, { ...config, params }).then(res => res.data)