import { useTickets } from "@/hooks/budget/capex/useTickets"
import { ArrowLeft, Columns2, ParkingMeterIcon, SunMedium, Ticket } from "lucide-react"
import { Link } from "react-router"

export default function Tracing() {
    const { tickets, addTickets } = useTickets()

    console.log(tickets)

    return (
        <div className="flex flex-col items-center px-4 md:px-6 mt-14 lg:px-8 py-5 md:pt-6 lg:pt-8 lg:pb-12">
            <div className="flex min-h-full w-full max-w-[1400px] flex-col">

                {/* NAV TABS */}
                <div className="flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-18 right-0 left-0 z-10 -mt-px h-14 border-b xl:left-60 2xl:top-20 2xl:left-72">
                    <div className="flex min-h-full w-full max-w-[1400px] flex-col">
                        <div className="relative h-full border-t border-gray-100 dark:border-gray-300/50">
                            <div className="no-scrollbar mr-14 flex h-full gap-2 overflow-hidden lg:gap-4 pointer-coarse:-mx-4 pointer-coarse:overflow-scroll pointer-coarse:px-4 md:pointer-coarse:-mx-6 md:pointer-coarse:px-6 lg:pointer-coarse:-mx-8 lg:pointer-coarse:px-8">
                                <div className="">
                                    <Link aria-current="page" to="/budget/analytics/tracing/" className="router-link-active router-link-exact-active group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden border-[#2b7fff] text-[#2b7fff] hover:text-[#2b7fff]">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Columns2 /> Seguimiento
                                        </div>
                                    </Link>
                                </div>
                                <div className="">
                                    <Link to="/budget/analytics/tickets/" className="group inline-flex h-full cursor-pointer items-center border-b-[3px] focus:outline-hidden text-gray-500 hover:text-darktext border-transparent">
                                        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 leading-6 font-medium whitespace-nowrap group-hover:bg-gray-100 group-focus-visible:bg-gray-100 dark:group-hover:bg-gray-300/50 group-focus-visible:dark:bg-gray-300/50">
                                            <Ticket /> Tickets
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>


                {/* Breadcrumb */}
                <div className="flex gap-4 mb-5 md:mb-6 lg:mb-8">
                    <a 
                        href="#" 
                        title="Atrás" 
                        className="bg-white flex size-8 flex-none items-center justify-center self-start rounded-full text-gray-400 hover:text-[#2b7fff] lg:size-10 dark:text-gray-500 dark:hover:text-violet-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </a>
                    <h2 className="text-2xl font-semibold text-[#2b7fff]">Seguimiento</h2>
                </div>
            </div>
        </div>
    )
}