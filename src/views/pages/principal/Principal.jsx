import { Link, useNavigate } from "react-router";
import ModuleCard from "@/components/ModuleCard/ModuleCard";
import { modules } from "@/constants/_modules";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";

export default function PrincipalPage() {

    const { logout } = useLogin()
	const { user } = useAuth()
	const navigate = useNavigate()

    const handleSignOut = () => {
		console.log("Sign Out")
		logout()
		navigate("/login", { replace: true })
	}

	return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <main className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="">
                        <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">Módulos Workflow</h2>
                        <p className="text-muted-foreground">Selecciona el módulo al que deseas acceder</p>
                    </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {modules.map((module) => (
                        module.active ?
                            <Link key={module.href} to={module.href}>
                                <ModuleCard {...module} />
                            </Link>
                            :
                            <Link key={module.href}>
                                <ModuleCard {...module} />
                            </Link>
                    ))}
                </div>
            </main>
        </div>
    )
}