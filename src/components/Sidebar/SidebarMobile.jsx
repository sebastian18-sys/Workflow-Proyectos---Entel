import { useState } from "react"
import { NavLink } from "react-router"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

export default function SidebarMobile({ sidebar }) {

    const [activeItem, setActiveItem] = useState("")
    const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)

    return (

        <div className="bg-white fixed right-0 bottom-0 left-0 z-10 box-content h-16 border-t px-4 pb-[env(safe-area-inset-bottom)] xl:hidden">
            <div className="mx-auto flex max-w-md items-center justify-around sm:max-w-fit">

                {sidebar && sidebar.map((item) => {

                    const Icon = item.icon
                    const isActive = activeItem === item.id
                    const isChild = item._children.length > 0
                    // const isOpen = openIds.has(item.id)
                    return (

                        <Popover key={item.id}>
                            <PopoverTrigger asChild>
                                <NavLink 
                                    key={item.id} 
                                    to={item.path} 
                                    // group relative h-16 w-18 max-w-full pt-1.5 text-center text-lighttext hover:text-lighttext
                                    className="group text-[#6a7282] relative h-16 w-18 max-w-full pt-1.5 text-center text-lighttext hover:text-lighttext"
                                >
                                    {/* <div className="mx-auto flex h-8 max-w-14 items-center justify-center rounded-full group-hover:bg-gray-100 dark:group-hover:bg-gray-300/50"> */}
                                    <div className="mx-auto flex h-8 max-w-14 items-center justify-center rounded-full group-hover:bg-gray-100 dark:group-hover:bg-gray-300/50">
                                        <Icon />
                                    </div>
                                    <div className="mt-0.5 truncate text-[0.6875rem] font-medium">{item.label}</div>

                                </NavLink>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" align="end">

                                {isChild &&     
                                <div className="space-y-3 p-3">
                                    {item._children.map((item) => {
                                        const Icon = item.icon
                                        const isActive = activeItem === item.id

                                        return (
                                            <NavLink 
                                                key={item.id} 
                                                to={item.path} 
                                                // className="group/a text-mediumtext hover:text-white-a flex flex-row flex-nowrap items-center gap-3 truncate rounded-sm px-3 py-1.5 font-normal hover:bg-[#cce5ff]"
                                                className={({ isActive }) =>
                                                    [
                                                        "group/a text-mediumtext hover:text-white-a flex flex-row flex-nowrap items-center gap-3 truncate rounded-sm px-3 py-1.5 font-normal hover:bg-[#cce5ff]",
                                                        isActive ? "bg-[#CCE5FF] text-[#3B82F6]" : "text-[#6a7282] hover:bg-sidebar-accent"
                                                    ].join(" ")
                                                }
                                            >
                                                {/* "icon icon-sm group-hover/a:text-white-a dark:group-hover/a:text-white-a text-gray-400 dark:text-gray-500" */}
                                                <div className="icon icon-sm group-hover/a:text-white-a dark:group-hover/a:text-white-a  dark:text-gray-500">
                                                    <Icon />
                                                </div>
                                                <div className="truncate">{item.label}</div>
                                            </NavLink>
                                        )
                                    })}
                                </div>}
                            </PopoverContent>
                        </Popover>       
                    )
                })}
            </div>
        </div>

    )

}