export function isEmptyFilterValue(value) {
    return (
        value == null ||
        value === "" ||
        value === "Todos" ||
        value === "ALL"
    );
}

export function formatDateParam(value) {
    if (!value) return "";

    if (!(value instanceof Date)) {
        return value;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function activeFiltersToParams(activeFilters = [], options = {}) {
    const { defaults = {}, omitEmpty = true } = options;

    return activeFilters.reduce((acc, filter) => {
        const key = filter?.paramKey || filter?.filterId;
        const value = filter?.rawValue ?? filter?.value;

        if (!key) return acc;

        if (filter?.type === "date" && value && typeof value === "object") {
            const fromParam = filter.fromParam || `${key}_from`;
            const toParam = filter.toParam || `${key}_to`;

            if (!omitEmpty || !isEmptyFilterValue(value.from)) {
                acc[fromParam] = formatDateParam(value.from);
            }

            if (!omitEmpty || !isEmptyFilterValue(value.to)) {
                acc[toParam] = formatDateParam(value.to);
            }

            return acc;
        }

        if (omitEmpty && isEmptyFilterValue(value)) {
            return acc;
        }

        acc[key] = value;
        return acc;
    }, { ...defaults });
}