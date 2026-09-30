import { useState } from "react"

export default function useTableTool({ columns }) {

    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Order and Direction
    const [sortBy, setSortBy] = useState("nombre")
    const [sortDirection, setSortDirection] = useState("asc")
    const [currentPage, setCurrentPage] = useState(1)
    // Columns Visibility
    const [visibleColumns, setVisibleColumns] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col.id]: col.visible }), {}),
    )

    const toggleColumn = (columnId) => {
        setVisibleColumns((prev) => ({
            ...prev,
            [columnId]: !prev[columnId],
        }))
    }

    return {
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        sortDirection,
        setSortDirection,
        itemsPerPage,
        setItemsPerPage,
        visibleColumns,
        toggleColumn,
    }
}