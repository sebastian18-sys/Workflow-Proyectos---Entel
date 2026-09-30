import { useState, useMemo } from "react"

function formatDateLabel(value) {
    if (!value) return "...";

    if (!(value instanceof Date)) {
        return String(value);
    }

    return value.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getOptionValue(option) {
    if (option && typeof option === "object") {
        return option.value;
    }

    return option;
}

function getOptionLabel(option) {
    if (option && typeof option === "object") {
        return option.label ?? option.value;
    }

    return option;
}

// export default function useFilter({ columns, availableFilters }) {

//     // PopOver
//     const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

//     // Advanced Filters Query
//     const [activeFilters, setActiveFilters] = useState([])
//     const [filterSearchQuery, setFilterSearchQuery] = useState("")
//     const [selectedFilterType, setSelectedFilterType] = useState(null)
//     const [tempFilterValue, setTempFilterValue] = useState("")
//     const [tempDateFrom, setTempDateFrom] = useState(undefined)
//     const [tempDateTo, setTempDateTo] = useState(undefined)
//     const [filtersAdvanced, setFiltersAdvanced] = useState({
//         capex_opex: "",
//         codigo: "",
//         proyecto: "",
//         nombreInversion: "",
//         gerenciaResponsable: "",
//         jefatura: "",
//         pm: "",
//         requestor: "",
//         dateFrom: undefined,
//         dateTo: undefined,
//     })
//     const [activeFiltersCount, setActiveFiltersCount] = useState(0)
//     const [filterDialogOpen, setFilterDialogOpen] = useState(false)
    
//     const applyFilters = () => {

//         let count = 0
//         Object.entries(filtersAdvanced).forEach(([key, value]) => {
//             if (key === "dateFrom" || key === "dateTo") {
//                 if (value) count++
//             } else if (value && value !== "") {
//                 count++
//             }
//         })

//         console.log(filtersAdvanced)
//         console.log(count)

//         setActiveFiltersCount(count)
//         setFilterPopoverOpen(false)
//         // setFilterDialogOpen(false)
//     }

//     const clearFilters = () => {
//         setFiltersAdvanced({
//             capex_opex: "",
//             codigo: "",
//             proyecto: "",
//             nombreInversion: "",
//             gerenciaResponsable: "",
//             jefatura: "",
//             pm: "",
//             requestor: "",
//             dateFrom: undefined,
//             dateTo: undefined,
//         })
//         setActiveFiltersCount(0)
//     }

//     const addFilter = (filterId) => {
//         const filterDef = availableFilters.find((f) => f.id === filterId)
//         if (!filterDef) return

//         setSelectedFilterType(filterId)
//         setTempFilterValue("")
//         setTempDateFrom(undefined)
//         setTempDateTo(undefined)
//     }

//     const confirmFilter = () => {
//         if (!selectedFilterType) return

//         const filterDef = availableFilters.find((f) => f.id === selectedFilterType)
//         if (!filterDef) return

//         let value = tempFilterValue
//         let displayValue = tempFilterValue

//         if (filterDef.type === "date") {
//         if (!tempDateFrom && !tempDateTo) return
//             value = { from: tempDateFrom, to: tempDateTo }
//             displayValue = `${tempDateFrom ? format(tempDateFrom, "dd/MM/yyyy") : "..."} - ${tempDateTo ? format(tempDateTo, "dd/MM/yyyy") : "..."}`
//         }

//         if (filterDef.type !== "date" && !value) return

//         const newFilter = {
//             id: `${selectedFilterType}-${Date.now()}`,
//             filterId: selectedFilterType,
//             label: filterDef.label,
//             type: filterDef.type,
//             value: displayValue,
//         }

//         setActiveFilters([...activeFilters, newFilter])
//         setSelectedFilterType(null)
//         setTempFilterValue("")
//         setTempDateFrom(undefined)
//         setTempDateTo(undefined)
//     } 

//     const removeFilter = (filterId) => {
//         setActiveFilters(activeFilters.filter((f) => f.id !== filterId))
//     }

//     const clearAllFilters = () => {
//         setActiveFilters([])
//         setSelectedFilterType(null)
//     }

//     const filteredAvailableFilters = availableFilters.filter((f) =>
//         f.label.toLowerCase().includes(filterSearchQuery.toLowerCase()),
//     )

//     return {
//         activeFilters,
//         filteredAvailableFilters,
//         selectedFilterType,
//         setSelectedFilterType,
//         filterSearchQuery,
//         setFilterSearchQuery,
//         tempFilterValue,
//         setTempFilterValue,
//         filterPopoverOpen,
//         setFilterPopoverOpen,
//         applyFilters,
//         clearFilters,
//         addFilter,
//         confirmFilter,
//         removeFilter,
//         clearAllFilters
//     }
// }

export default function useFilter({
    columns = [],
    availableFilters = [],
    activeFilters: controlledActiveFilters,
    onActiveFiltersChange,
}) {
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

    const [internalActiveFilters, setInternalActiveFilters] = useState([]);
    const [filterSearchQuery, setFilterSearchQuery] = useState("");
    const [selectedFilterType, setSelectedFilterType] = useState(null);

    const [tempFilterValue, setTempFilterValue] = useState("");
    const [tempDateFrom, setTempDateFrom] = useState(undefined);
    const [tempDateTo, setTempDateTo] = useState(undefined);

    const isControlled = Array.isArray(controlledActiveFilters);

    const activeFilters = isControlled
        ? controlledActiveFilters
        : internalActiveFilters;

    const setActiveFilters = (updater) => {
        if (isControlled) {
            const nextValue =
                typeof updater === "function"
                    ? updater(activeFilters)
                    : updater;

            onActiveFiltersChange?.(nextValue);
            return;
        }

        setInternalActiveFilters(updater);
    };

    const addFilter = (filterId) => {
        const filterDef = availableFilters.find((filter) => filter.id === filterId);
        if (!filterDef) return;

        setSelectedFilterType(filterId);
        setTempFilterValue("");
        setTempDateFrom(undefined);
        setTempDateTo(undefined);
    };

    const confirmFilter = () => {
        if (!selectedFilterType) return;

        const filterDef = availableFilters.find(
            (filter) => filter.id === selectedFilterType
        );

        if (!filterDef) return;

        let rawValue = tempFilterValue;
        let displayValue = tempFilterValue;

        if (filterDef.type === "date") {
            if (!tempDateFrom && !tempDateTo) return;

            rawValue = {
                from: tempDateFrom,
                to: tempDateTo,
            };

            displayValue = `${formatDateLabel(tempDateFrom)} - ${formatDateLabel(tempDateTo)}`;
        }

        if (filterDef.type === "select") {
            const selectedOption = filterDef.options?.find(
                (option) => String(getOptionValue(option)) === String(tempFilterValue)
            );

            displayValue = getOptionLabel(selectedOption) ?? tempFilterValue;
        }

        if (filterDef.type !== "date" && !rawValue) return;

        const newFilter = {
            id: `${selectedFilterType}-${Date.now()}`,
            filterId: selectedFilterType,
            paramKey: filterDef.paramKey || selectedFilterType,
            fromParam: filterDef.fromParam,
            toParam: filterDef.toParam,
            label: filterDef.label,
            type: filterDef.type,
            value: displayValue,
            rawValue,
        };

        setActiveFilters((prev) => {
            const withoutSameFilter = prev.filter(
                (filter) => filter.filterId !== selectedFilterType
            );

            return [...withoutSameFilter, newFilter];
        });

        setSelectedFilterType(null);
        setTempFilterValue("");
        setTempDateFrom(undefined);
        setTempDateTo(undefined);
    };

    const removeFilter = (filterId) => {
        setActiveFilters((prev) => prev.filter((filter) => filter.id !== filterId));
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
        setSelectedFilterType(null);
        setTempFilterValue("");
        setTempDateFrom(undefined);
        setTempDateTo(undefined);
    };

    const filteredAvailableFilters = useMemo(() => {
        return availableFilters.filter((filter) =>
            filter.label.toLowerCase().includes(filterSearchQuery.toLowerCase())
        );
    }, [availableFilters, filterSearchQuery]);

    return {
        activeFilters,
        filteredAvailableFilters,

        selectedFilterType,
        setSelectedFilterType,

        filterSearchQuery,
        setFilterSearchQuery,

        tempFilterValue,
        setTempFilterValue,

        tempDateFrom,
        setTempDateFrom,

        tempDateTo,
        setTempDateTo,

        filterPopoverOpen,
        setFilterPopoverOpen,

        addFilter,
        confirmFilter,
        removeFilter,
        clearAllFilters,
    };
}