import { useEffect, useMemo, useState } from "react";

export function useOptionsFilter({
    request,
    params = {},
    enabled = true,
    initialOptions = {},
    debugName = "useFilterOptions",
}) {
    const [filterOptions, setFilterOptions] = useState(initialOptions);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [errorOptions, setErrorOptions] = useState(null);

    const paramsKey = useMemo(() => {
        return JSON.stringify(params ?? {});
    }, [params]);

    useEffect(() => {
        if (!enabled || typeof request !== "function") return;

        const controller = new AbortController();

        const loadOptions = async () => {
            try {
                setLoadingOptions(true);
                setErrorOptions(null);

                const parsedParams = paramsKey ? JSON.parse(paramsKey) : {};

                const res = await request(parsedParams, {
                    signal: controller.signal,
                });

                if (controller.signal.aborted) return;

                setFilterOptions(res?.content || {});
            } catch (error) {
                if (controller.signal.aborted) return;

                console.error(`Error ${debugName}:`, error);
                setErrorOptions(error);
                setFilterOptions(initialOptions);
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingOptions(false);
                }
            }
        };

        loadOptions();

        return () => controller.abort();
    }, [request, enabled, paramsKey, debugName]);

    return {
        filterOptions,
        loadingOptions,
        errorOptions,
    };
}