import { useCallback, useEffect, useMemo, useState } from "react";

function getLocalStorage() {
    if (typeof window === "undefined") return null;
    return window.localStorage;
}

export function usePersistentAdvancedFilters({
    tableId,
    userKey = "",
    module = "workflowgcir",
    initialValue = [],
    version = "v1",
}) {
    const storageKey = useMemo(() => {
        const userPart = userKey ? `:${userKey}` : "";
        return `${module}:filters:${tableId}${userPart}:${version}`;
    }, [module, tableId, userKey, version]);

    const [activeAdvancedFilters, setActiveAdvancedFilters] = useState(() => {
        const storage = getLocalStorage();

        if (!storage || !tableId) return initialValue;

        try {
            const saved = storage.getItem(storageKey);
            if (!saved) return initialValue;

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : initialValue;
        } catch (error) {
            console.error("Error leyendo filtros desde localStorage:", error);
            return initialValue;
        }
    });

    useEffect(() => {
        const storage = getLocalStorage();

        if (!storage || !tableId) return;

        try {
            if (!activeAdvancedFilters.length) {
                storage.removeItem(storageKey);
                return;
            }

            storage.setItem(storageKey, JSON.stringify(activeAdvancedFilters));
        } catch (error) {
            console.error("Error guardando filtros en localStorage:", error);
        }
    }, [activeAdvancedFilters, storageKey, tableId]);

    const removeAdvancedFilter = useCallback((filterId) => {
        setActiveAdvancedFilters((prev) =>
            prev.filter((filter) => filter.id !== filterId)
        );
    }, []);

    const clearAdvancedFilters = useCallback(() => {
        setActiveAdvancedFilters([]);
    }, []);

    return {
        activeAdvancedFilters,
        setActiveAdvancedFilters,
        removeAdvancedFilter,
        clearAdvancedFilters,
        storageKey,
    };
}