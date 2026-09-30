import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { NavLink, useNavigate } from "react-router"
import { useLogin } from "@/hooks/useLogin"
import { Spinner } from "@/components/ui/spinner"
import Turnstile from "react-turnstile"

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

export default function LoginPage() {

	const { isLoginLoading, hasLoginError, isLogged, login, captchaRef, captchaKey, onVerify, onExpire } = useLogin()
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const navigate = useNavigate()

	useEffect(() => {
		if (isLogged) {
			navigate("/home", { replace: true })
		}
	}, [isLogged, navigate])

	const handleSubmit = (e) => {
		e.preventDefault()
		try {
			login(username, password)
		} catch (error) {
			console.error(error)
		}
  	}	

  	return (
		<div className="min-h-screen bg-gray-100 flex md:flex-row flex-col">
		{/* Panel izquierdo - Formulario de login */}
			<div className="flex-1 flex items-center justify-center p-8">
				<Card className="w-full max-w-md bg-white shadow-lg border-0">
					<CardContent className="p-8">
						{/* Logo */}
						<div className="flex justify-center mb-8">
							<img src="/entel_logo.svg" alt="logo" className="w-18 h-18 rounded-full flex items-center justify-center relative" loading="lazy" />
						</div>

						{/* FORM */}
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<Input
									type="text"
									placeholder="Usuario"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className="w-full h-12 px-4 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
								/>
							</div>

							<div className="relative">
								<Input
									type="password"
									placeholder="Contraseña"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
								/>
							</div>

							<Turnstile 
								key={captchaKey}
								ref={captchaRef}
								sitekey={SITE_KEY}
								// execution="execute"
								// responseField={false}
								appearance="always"
								execution="render"
								onVerify={onVerify}
								onExpire={onExpire}
								options={{ 
									theme: "auto",
									// appearance: "interaction-only",
									action: "login"
								 }}
							/>

							{isLoginLoading && (
								<Button
									disabled
									className="w-full h-12 text-[1rem] bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center justify-center gap-2 opacity-50"
								>
									<Spinner />
								</Button>
							)}
							{!isLoginLoading && (
								<Button
									type="submit"
									className="w-full h-12 text-[1rem] bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center justify-center gap-2 cursor-pointer"
								>
									Iniciar sesión
									<ArrowRight size={32} />
								</Button>
							)}
							{hasLoginError && (
								<div>
									<p className="text-red-600 text-sm">Credenciales Inválidas</p>
								</div>
							)}
							
						</form>

						<div className="mt-6 text-center">
							<span className="text-gray-600 text-sm">¿No recuerdas tus datos? </span>
							<a href="#" className="text-blue-600 text-sm hover:underline">
								Recuperar contraseña
							</a>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Panel derecho - Ilustración */}
			<div className="w-full md:w-1/2 bg-blue-50 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden min-h-[400px] md:min-h-0">
				{/* Título */}
				<h1 className="text-3xl md:text-5xl font-bold text-blue-500 mb-8 md:mb-12 text-center">
					Workflow de Proyectos
				</h1>

				<p className="text-xl md:text-2xl font-bold text-blue-300 mb-8 text-center">
					Construcción e Infraestructura
				</p>

				{/* Documento principal central */}
				<div className="relative w-72 h-60 md:w-96 md:h-80">
					{/* Documento principal central */}
					<div className="absolute top-12 md:top-16 left-1/2 transform -translate-x-1/2 w-24 h-32 md:w-32 md:h-40 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center">
					<div className="w-16 h-20 md:w-20 md:h-24 bg-blue-100 rounded-lg mb-2 flex items-center justify-center">
						{/* Gráfico de barras */}
						<div className="flex items-end space-x-1 h-8 md:h-12">
							<div className="w-1.5 md:w-2 bg-blue-500 rounded-t" style={{ height: "60%" }}></div>
							<div className="w-1.5 md:w-2 bg-blue-400 rounded-t" style={{ height: "80%" }}></div>
							<div className="w-1.5 md:w-2 bg-blue-600 rounded-t" style={{ height: "40%" }}></div>
							<div className="w-1.5 md:w-2 bg-blue-500 rounded-t" style={{ height: "90%" }}></div>
						</div>
					</div>
					<div className="w-12 md:w-16 h-1 bg-gray-300 rounded mb-1"></div>
						<div className="w-8 md:w-12 h-1 bg-gray-300 rounded"></div>
					</div>

					{/* Documento de calendario */}
					<div className="absolute top-6 md:top-8 left-6 md:left-8 w-18 h-24 md:w-24 md:h-32 bg-white rounded-lg shadow-md transform rotate-12 flex flex-col items-center justify-center">
						<div className="w-12 h-16 md:w-16 md:h-20 bg-gray-100 rounded mb-2 p-1 md:p-2">
							{/* Calendario con días */}
							<div className="grid grid-cols-3 gap-0.5 md:gap-1">
							<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded"></div>
							<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded"></div>
							<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded"></div>
							<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded"></div>
							<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-400 rounded"></div>
							<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded"></div>
							</div>
						</div>
						<div className="w-8 md:w-12 h-1 bg-gray-300 rounded"></div>
						</div>

						{/* Documento de tareas con checklist */}
						<div className="absolute top-8 md:top-12 right-6 md:right-8 w-18 h-24 md:w-24 md:h-32 bg-white rounded-lg shadow-md transform -rotate-12 flex flex-col items-center justify-center">
						<div className="w-12 h-16 md:w-16 md:h-20 bg-orange-100 rounded mb-2 flex flex-col items-center justify-center p-1 md:p-2">
							{/* Lista de tareas con checkmarks */}
							<div className="space-y-0.5 md:space-y-1">
							<div className="flex items-center space-x-0.5 md:space-x-1">
								<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></div>
								<div className="w-6 md:w-8 h-0.5 bg-gray-400 rounded"></div>
							</div>
							<div className="flex items-center space-x-0.5 md:space-x-1">
								<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-400 rounded-full"></div>
								<div className="w-4 md:w-6 h-0.5 bg-gray-400 rounded"></div>
							</div>
							<div className="flex items-center space-x-0.5 md:space-x-1">
								<div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full"></div>
								<div className="w-5 md:w-7 h-0.5 bg-gray-400 rounded"></div>
							</div>
							</div>
						</div>
						<div className="w-8 md:w-12 h-1 bg-gray-300 rounded"></div>
					</div>

					{/* Dashboard de métricas */}
					<div className="absolute bottom-12 md:bottom-16 left-8 md:left-12 w-16 h-20 md:w-20 md:h-24 bg-white rounded-lg shadow-md transform rotate-6">
						<div className="p-1.5 md:p-2">
							{/* Gráfico circular */}
							<div className="w-full h-8 md:h-12 bg-blue-200 rounded mb-1 flex items-center justify-center">
							<div className="w-6 h-6 md:w-8 md:h-8 border-2 md:border-4 border-blue-500 border-t-transparent rounded-full"></div>
							</div>
							<div className="w-3/4 h-0.5 md:h-1 bg-gray-300 rounded mb-0.5 md:mb-1"></div>
							<div className="w-1/2 h-0.5 md:h-1 bg-gray-300 rounded"></div>
						</div>
					</div>

					{/* Documento de reportes con progreso */}
					<div className="absolute bottom-8 md:bottom-12 right-12 md:right-16 w-16 h-20 md:w-20 md:h-24 bg-white rounded-lg shadow-md transform -rotate-6">
						<div className="p-1.5 md:p-2">
							{/* Barra de progreso */}
							<div className="w-full h-6 md:h-8 bg-green-200 rounded mb-1 md:mb-2 overflow-hidden">
							<div className="h-full bg-green-500 rounded w-3/4"></div>
							</div>
							<div className="w-full h-0.5 md:h-1 bg-gray-300 rounded mb-0.5 md:mb-1"></div>
							<div cla0ssName="w-2/3 h-0.5 md:h-1 bg-gray-300 rounded"></div>
						</div>
					</div>

					{/* Líneas de conexión punteadas animadas */}
					<svg className="absolute inset-0 w-full h-full" viewBox="0 0 288 240 md:0 0 384 320">
						<path
							d="M 60 90 Q 144 75 228 105"
							stroke="#3b82f6"
							strokeWidth="1.5"
							strokeDasharray="6,3"
							fill="none"
							opacity="0.6"
							className="animate-[dash_2s_linear_infinite] md:hidden"
						/>
						<path
							d="M 80 120 Q 192 100 304 140"
							stroke="#3b82f6"
							strokeWidth="2"
							strokeDasharray="8,4"
							fill="none"
							opacity="0.6"
							className="animate-[dash_2s_linear_infinite] hidden md:block"
						/>
						<path
							d="M 75 150 Q 144 135 213 165"
							stroke="#3b82f6"
							strokeWidth="1.5"
							strokeDasharray="6,3"
							fill="none"
							opacity="0.6"
							className="animate-[dash_2s_linear_infinite] md:hidden"
							style={{ animationDelay: "0.5s" }}
						/>
						<path
							d="M 100 200 Q 192 180 284 220"
							stroke="#3b82f6"
							strokeWidth="2"
							strokeDasharray="8,4"
							fill="none"
							opacity="0.6"
							className="animate-[dash_2s_linear_infinite] hidden md:block"
							style={{ animationDelay: "0.5s" }}
						/>
						<path
							d="M 144 60 L 144 180"
							stroke="#3b82f6"
							strokeWidth="1.5"
							strokeDasharray="6,3"
							fill="none"
							opacity="0.4"
							className="animate-[dash_2s_linear_infinite] md:hidden"
							style={{ animationDelay: "1s" }}
						/>
						<path
							d="M 192 80 L 192 240"
							stroke="#3b82f6"
							strokeWidth="2"
							strokeDasharray="8,4"
							fill="none"
							opacity="0.4"
							className="animate-[dash_2s_linear_infinite] hidden md:block"
							style={{ animationDelay: "1s" }}
						/>
					</svg>

					{/* Elementos flotantes animados */}
					<div className="absolute top-3 md:top-4 right-9 md:right-12 w-4 h-4 md:w-6 md:h-6 bg-orange-400 rounded-full opacity-80 animate-[orbit_8s_linear_infinite]"></div>
						<div className="absolute top-15 md:top-20 right-3 md:right-4 text-blue-500 text-xl md:text-2xl animate-[spin_4s_linear_infinite]">
						×
						</div>
						<div className="absolute bottom-6 md:bottom-8 left-3 md:left-4 w-6 h-1.5 md:w-8 md:h-2 bg-blue-500 rounded-full animate-[float_2s_ease-in-out_infinite]"></div>
					<div className="absolute bottom-24 md:bottom-32 right-3 md:right-4 w-3 h-3 md:w-4 md:h-4 border-2 border-blue-400 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>

					{/* Esferas adicionales con movimiento */}
					<div className="absolute top-24 md:top-32 left-3 md:left-4 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full animate-[bounce_3s_ease-in-out_infinite]"></div>
					<div className="absolute top-36 md:top-48 right-15 md:right-20 w-4 h-4 md:w-5 md:h-5 bg-purple-400 rounded-full animate-[orbit_6s_linear_infinite_reverse]"></div>
					<div className="absolute bottom-15 md:bottom-20 left-15 md:left-20 w-3 h-3 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-[float_4s_ease-in-out_infinite]"></div>
				</div>

				{/* Elementos de fondo decorativos sutiles con animación */}
				<div className="absolute top-24 md:top-32 left-12 md:left-16 w-32 h-32 md:w-40 md:h-40 bg-blue-100 rounded-full opacity-20 animate-[pulse_6s_ease-in-out_infinite]"></div>
				<div className="absolute bottom-18 md:bottom-24 right-9 md:right-12 w-24 h-24 md:w-32 md:h-32 bg-blue-200 rounded-full opacity-15 animate-[pulse_8s_ease-in-out_infinite]"></div>
			</div>
		</div>
  	)
}