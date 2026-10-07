import { Helmet } from "react-helmet"
import Navbar from "../Navbar/Navbar"
import Sidebar from "../Sidebar/Sidebar"
import { Outlet } from "react-router-dom";
import SidebarMobile from "../Sidebar/SidebarMobile";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthz } from "@/hooks/useAuthz";
import { filterNav } from "@/lib/filterNav";

export default function Layout({ title, module, sidebar, children }) {

    const [isCollapsed, setIsCollapsed] = useState(false)
    const { loading, can } = useAuthz()

    const filteredSidebar = useMemo(() => {
        if (loading) return [];              
        return filterNav(sidebar, can);
    }, [loading, sidebar, can]);

    return (
        <>
            <Helmet>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{title}</title>
            </Helmet>
            <div className={cn("flex min-h-dvh flex-col pt-18 pb-[calc(env(safe-area-inset-bottom)+4rem)] xl:pb-0 xl:pl-60 2xl:pt-20 2xl:pl-72", isCollapsed && "2xl:pl-16 xl:pl-16")}>
                <Sidebar sidebar={filteredSidebar} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                {/* <div className="flex-1 bg-[#f3f4f6] flex flex-col overflow-hidden"> */}
                <div className="min-w-0 flex-1 bg-[#f3f4f6] flex flex-col overflow-x-hidden">
                    <Navbar module={module} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
                    <wc-toast position="bottom-right" ></wc-toast>
                    <SidebarMobile sidebar={filteredSidebar} />
                    <Outlet context={{ isCollapsed }} />
                </div>
            </div>
        </>
    )
}