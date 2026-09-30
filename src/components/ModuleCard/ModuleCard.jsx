import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ModuleCard({ title, description, icon: Icon, gradient, active }) {
	return (

        // <Card 
        //     className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-border/40 bg-white overflow-hidden relative"
        // >
        <Card 
            className={cn(
                "relative overflow-hidden transition-all duration-300 border-border/40 bg-white",
                active 
                ? "group cursor-pointer hover:shadow-2xl hover:-translate-y-2" 
                : "opacity-60 cursor-default"
            )}
        >

            {/* Ribbon Badge para módulos inactivos */}
            {!active && (
                <div className="absolute top-0 right-0 z-10 overflow-hidden w-24 h-24">
                    <div className="absolute top-3 right-[-35px] w-[140px] bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white text-xs font-bold py-1.5 text-center rotate-45 transform shadow-md">
                        Soon
                    </div>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardContent className="p-6 relative">
                <div className="space-y-4">
                    <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                    >
                        <Icon className="w-7 h-7" strokeWidth={2.5} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:bg-gradient-to-r group-hover:from-[#3B82F6] group-hover:to-[#CC35FF] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
                    </div>
                    <div className="pt-2 flex items-center text-[#3B82F6] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span>Acceder al módulo</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                </div>
            </CardContent>
        </Card>
       
  )
}