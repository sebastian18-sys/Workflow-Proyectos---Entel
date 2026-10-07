import { useMemo, useRef, useState } from "react"
import { Search, Bell, User, LogOut, Home } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useLogin } from "@/hooks/useLogin"
import { useProjectsCapex } from "@/hooks/budget/capex/useProjectsCapex"
import ProjectSheet from "../Project_Sheet/ProjectSheet"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

export default function Navbar({ module, isCollapsed, setIsCollapsed }) {

	const { projects } = useProjectsCapex()
	const { logout } = useLogin()
	const { user } = useAuth()
	const navigate = useNavigate()
	
	// console.log("PROJECTS", projects)

	const handleSignOut = () => {
		console.log("Sign Out")
		logout()
		navigate("/login", { replace: true })
	}

	const getNumWeek = () => {
		const today = new Date()
		const onejan = new Date(today.getFullYear(), 0, 1)
		return Math.ceil(((today - onejan) / 86400000 + onejan.getDay() + 1) / 7)
	}	

	// búsqueda rápida
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selected, setSelected] = useState(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const anchorRef = useRef(null);

	const projectNames = useMemo(() => {
		const set = new Set();
		for (const d of projects) if (d.project_name) set.add(d.project_name);
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [projects]);

	const matches = useMemo(() => {
		if (!query) return projectNames.slice(0, 5);
		const q = query.toLowerCase();
		return projectNames.filter((p) => p.toLowerCase().includes(q)).slice(0, 5);
	}, [projectNames, query]);

	const projectRecords = useMemo(
		() => (selected ? projects.filter((d) => d.project_name === selected) : []),
		[projects, selected]
	);

	// console.log(projectRecords)

	const selectName = (name) => {
		setSelected(name);
		setOpen(false);
		setSheetOpen(true);
	};

	// Fixed: fixed top-0 right-0 w-full z-50
	// OLD: flex items-center justify-between gap-4 border-b bg-background px-6 py-3 h-15
	// NEW: flex flex-col items-center px-4 md:px-6 lg:px-8 bg-background-2 fixed top-0 right-0 left-0 z-10 h-18 border-b xl:left-60 2xl:left-72 2xl:h-20

	return (
		// flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-0 right-0 left-0 z-10 h-18 border-b xl:left-60 2xl:left-72 2xl:h-20
		<nav className={cn("flex flex-col items-center px-4 md:px-6 lg:px-8 bg-white fixed top-0 right-0 left-0 z-10 h-18 border-b xl:left-60 2xl:left-72 2xl:h-20 xl:px-10 2xl:px-14", isCollapsed && "2xl:left-16 xl:left-16")}>
			{/* <div className="flex min-h-full w-full max-w-[1400px] flex-col"> */}
			{/* NEW  */}
			<div className="flex min-h-full w-full flex-col">
				{/* Logo */}
				
				{/* Action Bar */}
				{/* OLD: flex items-center gap-8 */}
				<div className="flex h-full items-center gap-3 lg:gap-4">

					<div className="flex items-center gap-3 min-w-0 flex-1">
						<Link to="/home" className="flex-none" title="Inicio">	
							<div className="bg-white text-lighttext hover:text-darktext size-8 cursor-pointer items-center justify-center rounded-lg shadow-xs ring-1 ring-gray-300 outline-gray-300 transition-colors ring-inset hover:bg-gray-100 focus:outline-2 focus:outline-offset-2 focus:outline-solid xl:flex dark:shadow-none dark:ring-gray-600/40 dark:hover:bg-gray-900/10">
								<Home className="h-4 w-4 text-gray-500" />
							</div>
						</Link>
						<div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[14px] lg:flex-nowrap lg:gap-x-3">
							<Link to="/home" className="router-link-active truncate hover:text-[#2b7fff] text-darktext w-full font-semibold lg:w-auto">
								{module}
							</Link>
						</div>
					</div>

					{/* Week */}
					<Button className="items-center justify-center rounded-lg align-middle font-medium transition-colors focus:outline-2 focus:outline-solid ring-inset ring-1 ring-gray-300 shadow-xs dark:shadow-none hover:bg-white bg-white focus:outline-offset-2 outline-gray-300 text-gray-500 text-sm leading-6 px-3 py-2 gap-2 inline-flex">Week {getNumWeek()}</Button>
					{/* Search Bar */}
					{/* <div className="relative flex-1 max-w-lg">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input type="search" placeholder="Buscar Proyecto / Acceso rápido" className="pl-10 bg-muted/50" />
					</div> */}
					<div className="relative flex-1 max-w-lg">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<div ref={anchorRef} className="relative flex-1 max-w-lg">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										type="search"
										placeholder="Buscar Proyecto / Acceso rápido"
										className="pl-10 bg-gray-100 rounded-lg cursor-pointer border-none"
										value={query}
										onChange={(e) => {
											const v = e.target.value;
											setQuery(v);
											setOpen(true);
											setActiveIndex(0);
										}}
										onFocus={() => setOpen(true)}
										onKeyDown={(e) => {
											if (!matches.length) return;
											if (e.key === "ArrowDown") {
											e.preventDefault();
											setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
											} else if (e.key === "ArrowUp") {
											e.preventDefault();
											setActiveIndex((i) => Math.max(i - 1, 0));
											} else if (e.key === "Enter") {
											e.preventDefault();
											selectName(matches[activeIndex]);
											} else if (e.key === "Escape") {
											setOpen(false);
											}
										}}
									/>
								</div>
							</PopoverTrigger>

							<PopoverContent
								align="start"
								sideOffset={4}
								onOpenAutoFocus={(e) => e.preventDefault()}
								className="p-0 w-[420px] z-50"
							>
								<Command shouldFilter={false}>
									<CommandEmpty>Sin resultados</CommandEmpty>
									<CommandGroup heading="Proyectos">
										{matches.map((name, idx) => (
											<CommandItem
												key={name}
												value={name}
												// Evita que el click cierre por blur antes del onSelect
												onMouseDown={(e) => e.preventDefault()}
												onSelect={() => selectName(name)}
												className={idx === activeIndex ? "bg-muted" : ""}
											>
											{name}
											</CommandItem>
										))}
									</CommandGroup>
								</Command>
							</PopoverContent>
						</Popover>
						
						<ProjectSheet
							open={sheetOpen}
							onOpenChange={setSheetOpen}
							projectName={selected}
							records={projectRecords}
						/>
					</div>


					<div className="flex items-center gap-4">
						{/* Notifications */}
						<Button variant="ghost" size="icon" className="relative text-gray-500">
							<Bell className="h-5 w-5" />
							{/* <Badge
								variant="destructive"
								className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
							>
								2
							</Badge> */}
						</Button>

						{/* User Menu */}
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
									<Avatar className="h-10 w-10">
										<AvatarImage src="/placeholder.svg?height=32&width=32" />
										<AvatarFallback className="bg-[#005EFF] text-primary-foreground text-sm">{user?.firstName[0].toUpperCase()}{user?.lastName[0].toUpperCase()}</AvatarFallback>
									</Avatar>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-64 p-0" align="end">
								<div className="flex flex-col">
									{/* User Info */}
									<div className="px-4 py-3 border-b">
										<p className="font-medium text-sm">{user?.firstName + " " + user?.lastName}</p>
										<p className="text-sm text-muted-foreground">{user?.email}</p>
									</div>
									

									{/* Menu Items */}
									<div className="p-1">
										<Button variant="ghost" className="w-full justify-start gap-2 font-normal">
											<User className="h-4 w-4" />
											Perfil
										</Button>
										<Button
											onClick={handleSignOut}
											variant="ghost"
											className="w-full justify-start gap-2 font-normal text-blue-600 hover:text-blue-600 hover:bg-blue-50"
										>
											<LogOut className="h-4 w-4" />
											Cerrar sesión
										</Button>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</div>
		</nav>
	)
}