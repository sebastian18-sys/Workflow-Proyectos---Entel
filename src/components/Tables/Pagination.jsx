import getPaginationItems from "@/lib/pagination"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Pagination({ totalResults, totalPages, currentPage, setCurrentPage }) {

    const items = getPaginationItems(currentPage, totalPages, 5)

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                    Mostrando {Math.min(10, totalResults)} de {totalResults} resultados
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {items.map((it, idx) =>
                        it === "ellipsis" ? (
                        <span key={`e-${idx}`} className="px-2 select-none">…</span>
                        ) : (
                        <Button
                            key={it}
                            // variant={currentPage === it ? "bg-[#" : "outline"}
                            className={currentPage === it ? "bg-blue-500 hover:bg-blue-400 text-white" : "text-gray-500 cursor-pointer bg-white hover:bg-opacity-10"}
                            size="sm"
                            onClick={() => setCurrentPage(it)}
                        >
                            {it}
                        </Button>
                        )
                    )}

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div> 
        </>
    )
}