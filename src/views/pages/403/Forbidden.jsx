import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Home } from "lucide-react"

export default function Forbidden() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 px-4">
			<Card className="w-full max-w-md border-blue-100 shadow-sm">
				<CardHeader className="space-y-2">
					<div className="flex items-center gap-3">
						<div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50">
							<ShieldAlert className="h-6 w-6" style={{ color: "#3b82f6" }} />
						</div>
						<div>
							<CardTitle className="text-xl">
								Acceso denegado <span style={{ color: "#3b82f6" }}>403</span>
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								No tienes permisos para ver esta sección.
							</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-sm text-slate-700">
						Si crees que es un error, solicita acceso al administrador del módulo.
					</div>

					<div className="flex flex-col sm:flex-row gap-2">
						<Button asChild className="w-full" style={{ backgroundColor: "#3b82f6" }}>
							<Link to="/home">
								<Home className="mr-2 h-4 w-4" />
								Ir a Home
							</Link>
						</Button>
{/* 
						<Button asChild variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
							<Link to="/budget">
								Volver al módulo
							</Link>
						</Button> */}
					</div>

					<p className="text-xs text-muted-foreground">
						Workflow / Gestión de proyectos · Control de accesos
					</p>
				</CardContent>
			</Card>
		</div>
	)
}