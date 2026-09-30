import {
	ChevronDown,
	LogOut,
	PanelLeftClose,
	PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import findParentByPath from "@/lib/findParentByPath"
import { useLogin } from "@/hooks/useLogin"
import { useAuth } from "@/hooks/useAuth"

function findParentIdByPath(items, pathname) {
	for (const item of items) {
		if (item.path === pathname) return item.id;
		if (item._children?.length) {
			const match = item._children.find((child) => child.path === pathname);
			if (match) return item.id;
		}
	}
	return null;
}

function isItemActive(item, pathname) {
	if (item.path === pathname) return true;
	return item._children?.some((child) => child.path === pathname);
}

function isChildActive(child, pathname) {
  	return child.path === pathname;
}


function SidebarHeader({ isCollapsed, title = "Workflow" }) {
	return (
		<div className="sticky top-0 z-10 bg-white">
			<div className={cn("flex items-center gap-3 px-4 py-4", isCollapsed && "justify-center px-2")}>
				<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2b7fff] text-white">
				<LayoutDashboard className="h-5 w-5" />
				</div>
				{!isCollapsed && (
				<div className="min-w-0">
					<p className="text-sm font-semibold text-slate-900">{title}</p>
					<p className="text-xs text-slate-500">Project workspace</p>
				</div>
				)}
			</div>
		</div>
	);
}

function SidebarFooter({ isCollapsed }) {
	return (
		<div className="mt-auto border-t border-slate-200 px-3 py-3">
		<div className={cn("mb-3 rounded-2xl bg-slate-50 px-3 py-3", isCollapsed && "px-2")}>
			<div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
			<Avatar className="h-9 w-9">
				<AvatarFallback className="bg-[#2b7fff] text-xs font-semibold text-white">
				{getInitials(user.firstName, user.lastName)}
				</AvatarFallback>
			</Avatar>
			{!isCollapsed && (
				<div className="min-w-0">
				<p className="truncate text-sm font-semibold text-[#2b7fff]">
					{user.firstName} {user.lastName}
				</p>
				<p className="truncate text-xs text-slate-500">{user.title}</p>
				</div>
			)}
			</div>
		</div>

		<button
			className={cn(
			"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100",
			isCollapsed && "justify-center px-2"
			)}
		>
			<LogOut className="h-4 w-4" />
			{!isCollapsed && <span>Cerrar sesión</span>}
		</button>
		</div>
	);
}

export default function Sidebar({ sidebar: sidebar_nav, className, isCollapsed, setIsCollapsed }) {

	const { user } = useAuth()
	const { pathname } = useLocation();
	const { logout } = useLogin()
	const navigate = useNavigate()
    
    const [activeItem, setActiveItem] = useState("")
	// const [openIds, setOpenIds] = useState(() => {
	// 	const s = localStorage.getItem("sidebar:openIds");
	// 	return new Set(s ? JSON.parse(s) : []);
	// });

	const [openId, setOpenId] = useState(() => findParentIdByPath(sidebar_nav, pathname) ?? "proyectos");


	const handleSignOut = () => {
		console.log("Sign Out")
		logout()
		navigate("/login", { replace: true })
	}

	// const toggle = (id) =>
	// setOpenIds((prev) => {
	// 	const next = new Set(prev)
	// 	next.has(id) ? next.delete(id) : next.add(id)
	// 	return next
	// })

	// const toggle = (id) => {
	// 	setOpenIds((prev) => {
	// 		// si ya estaba abierto, cierro todo
	// 		if (prev.has(id)) return new Set();

	// 		// si abro uno, cierro los demás y dejo solo este
	// 		return new Set([id]);
	// 	});
	// };

	// useEffect(() => {
	// 	localStorage.setItem("sidebar:openIds", JSON.stringify([...openIds]));
	// }, [openIds]);

	// useEffect(() => {
	// 	const parent = findParentByPath(sidebar_nav, pathname);
	// 	if (parent) {
	// 	setOpenIds(prev => {
	// 		if (prev.has(parent.id)) return prev;
	// 		const next = new Set(prev);
	// 		next.add(parent.id);
	// 		return next;
	// 	});
	// 	}
	// }, [pathname, sidebar_nav]);

	return (
		<div
			className={cn(
				"bg-white fixed top-0 bottom-0 left-0 hidden w-60 overflow-y-auto overscroll-contain border-r xl:block 2xl:w-72",
				isCollapsed ? "w-16 2xl:w-16" : "w-60",
				className,
			)}
		>

			<div className="flex min-h-full flex-col px-2.5 pb-4 @[16rem]:px-6 @[16rem]:pb-6">
				<a href="/home" className="flex-none" title="Inicio">	
					<div className="bg-white sticky top-0 flex justify-center h-18 items-center px-3 2xl:h-20 @[16rem]:px-4">
						{/* {!isCollapsed && <img src="/workflow_logo_icon_same_height_OR.webp" alt="logo" className="flex items-center justify-center relative" />} */}
						{!isCollapsed && <img src="/logo_wf_3.png" alt="logo" className="flex items-center justify-center relative" />}
						{isCollapsed && <img src="/entel_logo.svg" alt="logo" className="w-11 h-11 rounded-full flex items-center justify-center relative" />}
					</div>
				</a>

				{/* Navigation */}
				{/* <nav className="flex-1 space-y-3">
					{sidebar_nav.map((item) => {
						const Icon = item.icon
						const isActive = activeItem === item.id
						const isChild = item._children.length > 0
						const isOpen = openIds.has(item.id)
					
						return (

							<div key={item.id} className="">
								<NavLink to={item.path}>
									<button
										onClick={() => !isCollapsed && isChild && toggle(item.id) }
										className={cn(
											"flex w-full items-center gap-3 rounded-lg px-3 py-2 mb-3 text-sm font-medium transition-colors",
											"text-[#6a7282] hover:bg-sidebar-accent",
											isCollapsed && "justify-center",
										)}
									>
										<Icon className="h-5 w-5 shrink-0 text-[#99a1af]" />
										{!isCollapsed && (
										<>
											<span className="flex-1 text-left">{item.label}</span>
											{isChild ? <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform", !isOpen && "-rotate-90")} /> : ""}	
										</>
										)}
									</button>
								</NavLink>
								{isChild && isOpen && (
									<div className={cn("space-y-3", isCollapsed && "hidden")}>
									{item._children.map((item) => {
										const Icon = item.icon
										const isActive = activeItem === item.id
										return (
											<NavLink 
												to={item.path}
												key={item.id}
												className={({ isActive }) =>
													[
														"flex items-center gap-3 rounded-lg text-[14px] px-2.5 py-2 pl-7 leading-6 transition-colors font-medium @[16rem]:gap-4 @[16rem]:pr-4 @[16rem]:pl-3 text-lighttext hover:text-darktext hover:bg-gray-100 dark:hover:bg-gray-300/50",
														isActive ? "bg-[#CCE5FF] text-[#3B82F6]" : "text-[#6a7282] hover:bg-sidebar-accent"
													].join(" ")
												}
											>
												<Icon className={"h-5 w-5 shrink-0"} />
												<span className="truncate">{item.label}</span>
											</NavLink>
										)
									})}
									</div>
								)}
							</div>
						)
					})}
				</nav> */}

				<div className="px-3 pb-3">
					{/* {!isCollapsed && (
					<div className="mb-3 px-1">
						<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input placeholder="Buscar módulo" className="h-10 rounded-xl border-slate-200 pl-9 shadow-none" />
						</div>
					</div>
					)} */}

					<nav className="space-y-1.5">
					{sidebar_nav.map((item) => {
						const Icon = item.icon;
						const active = isItemActive(item, pathname);
						const hasChildren = item._children?.length > 0;
						const isOpen = openId === item.id || active;

						const isParentActive =
							pathname === item.path ||
							item._children?.some((child) => child.path === pathname);

						// ITEM SIN HIJOS -> SI NAVEGA
						if (!hasChildren) {
							return (
								<NavLink
								key={item.id}
								to={item.path}
								className={({ isActive }) =>
									cn(
									"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
									isCollapsed && "justify-center px-2",
									isActive
										? "bg-[#eef5ff] text-[#2b7fff]"
										: "text-[#6a7282] hover:bg-slate-50 hover:text-slate-800"
									)
								}
								>
								{({ isActive }) => (
									<>
									<Icon
										className={cn(
										"h-5 w-5 shrink-0",
										isActive ? "text-[#2b7fff]" : "text-[#99a1af]"
										)}
									/>
									{!isCollapsed && (
										<span className="min-w-0 flex-1 truncate text-left">
										{item.label}
										</span>
									)}
									</>
								)}
								</NavLink>
							);
						}

						// ITEM PADRE CON HIJOS -> SOLO EXPANDE
						return (
							<div key={item.id}>
								<button
									type="button"
									onClick={() => hasChildren && setOpenId((prev) => (prev === item.id ? "" : item.id))}
									className={cn(
										"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
										isCollapsed && "justify-center px-2",
										isParentActive
										? "bg-[#f8fbff] text-[#2b7fff]"
										: "text-[#6a7282] hover:bg-slate-50 hover:text-slate-800"
									)}
								>
								<Icon
									className={cn(
									"h-5 w-5 shrink-0",
									isParentActive ? "text-[#2b7fff]" : "text-[#99a1af]"
									)}
								/>

								{!isCollapsed && (
									<>
									<span className="min-w-0 flex-1 truncate text-left font-medium">
										{item.label}
									</span>

									<ChevronDown
										className={cn(
										"h-4 w-4 shrink-0 transition-transform",
										isOpen && "rotate-180",
										isParentActive ? "text-[#2b7fff]" : "text-[#99a1af]"
										)}
									/>
									</>
								)}
								</button>

								{isOpen && !isCollapsed && (
								<div className="mt-1 space-y-1 pl-9">
									{item._children.map((child) => {
									const ChildIcon = child.icon;

									return (
										<NavLink
											key={child.id}
											to={child.path}
											className={({ isActive }) =>
												cn(
												"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
												isActive
													? "bg-[#dbeafe] text-[#2b7fff]"
													: "text-[#6a7282]/80 hover:bg-slate-50 hover:text-slate-700"
												)
											}
										>
										{({ isActive }) => (
											<>
											<ChildIcon
												className={cn(
												"h-4 w-4 shrink-0",
												isActive
													? "text-[#2b7fff]"
													: "text-[#99a1af] opacity-70"
												)}
											/>
											<span className="truncate">{child.label}</span>
											</>
										)}
										</NavLink>
									);
									})}
								</div>
								)}
							</div>
						);
					})}
					</nav>
				</div>


				{/* Footer */}
				<div className="mt-auto border-t boder-slate-200 py-3">
					{/* User Profile */}
					<div className={cn("mb-3 rounded-lg bg-sidebar-accent px-3 py-2", isCollapsed && "px-0")}>
						<div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
							<Avatar className="h-8 w-8">
								<AvatarImage src="/placeholder.svg?height=32&width=32" />
								<AvatarFallback className="bg-[#005EFF] text-primary-foreground text-xs">{user?.firstName[0].toUpperCase()}{user?.lastName[0].toUpperCase()}</AvatarFallback>
							</Avatar>
							{!isCollapsed && (
							<div className="flex-1 overflow-hidden">
								<p className="truncate text-sm font-medium text-[#005EFF]">{user?.firstName + " " + user?.lastName}</p>
								<p className="truncate text-xs text-[#005EFF]">{user?.title}</p>
							</div>
							)}
						</div>
					</div>
					{/* Sign Out */}
					<button
						onClick={handleSignOut}
						className={cn(
							"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#696969] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							isCollapsed && "justify-center",
						)}
						>
						<LogOut className="h-4 w-4" />
						{!isCollapsed && <p>Cerrar sesión</p>}
					</button>
				</div>
				{/* Collapse */}
				<div className="border-t border-sidebar-border py-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsCollapsed(!isCollapsed)}
						className={cn(
							"w-full gap-3 text-[#696969] hover:bg-sidebar-accen justify-end",
							isCollapsed && "justify-center px-0",
						)}
					>
						{isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
						{!isCollapsed}
					</Button>
				</div>

			</div>

		</div>
	)
}