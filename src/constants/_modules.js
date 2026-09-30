import { LayoutDashboard, Users, ShoppingCart, Package, BarChart3, Settings, FileText, Calendar } from "lucide-react"

export const modules = [
    {
      title: "Gestión de Proyectos",
      description: "Vista general de los proyectos",
      icon: LayoutDashboard,
      href: "/projects/dashboard",
      gradient: "from-[#3B82F6] to-[#2563EB]",
      active: true,
    },
    {
      title: "Presupuesto",
      description: "Vista presupuestal y reportería",
      icon: Calendar,
      href: "/budget",
      gradient: "from-[#CC35FF] to-[#3B82F6]",
      active: true,
    },
    {
      title: "Calidad & Procesos",
      description: "Gestión de calidad y procesos",
      icon: FileText,
      href: "/quality",
      gradient: "from-[#3B82F6] via-[#7C3AED] to-[#CC35FF]",
      active: false,
    },
    {
      title: "Administrador",
      description: "Administra usuarios, permisos y roles del sistema",
      icon: Users,
      href: "/usuarios",
      gradient: "from-slate-500 to-gray-600",
      active: false,
    },
    // {
    //   title: "Reportes",
    //   description: "Genera reportes detallados y análisis de datos",
    //   icon: BarChart3,
    //   href: "/reportes",
    //   gradient: "from-[#A020F0] to-[#CC35FF]",
    // from-[#CC35FF] to-[#A020F0]
    // },
    
    // {
    //   title: "Configuración",
    //   description: "Ajusta las configuraciones generales del sistema",
    //   icon: Settings,
    //   href: "/configuracion",
    //   gradient: "from-slate-500 to-gray-600",
    // },
  ]