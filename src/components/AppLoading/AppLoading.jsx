import { Card } from "@/components/ui/card"
import { Loader2, Workflow } from "lucide-react"

export default function AppLoading() {
	return (
		<div className="min-h-[100vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md border-blue-100 shadow-sm">
				<div className="p-6">
					<div className="flex items-center gap-3">
						<div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50">
							<Workflow className="h-6 w-6" style={{ color: "#3b82f6" }} />
						</div>

						<div className="flex-1">
							<p className="text-sm font-medium text-slate-900">
								Cargando módulos
							</p>
							<p className="text-xs text-muted-foreground">
								Workflow · Gestión de proyectos
							</p>
						</div>

						<Loader2 className="h-5 w-5 animate-spin" style={{ color: "#3b82f6" }} />
					</div>

					<div className="mt-5">
						<div className="h-2 w-full overflow-hidden rounded-full bg-blue-50">
							<div
								className="h-full w-1/2 animate-pulse rounded-full"
								style={{ backgroundColor: "#3b82f6" }}
							/>
						</div>
						<p className="mt-2 text-xs text-muted-foreground">
							Preparando vistas y permisos…
						</p>
					</div>
				</div>
			</Card>
		</div>
	)
}