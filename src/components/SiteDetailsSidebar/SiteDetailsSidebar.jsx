export default function SiteDetailsSidebar({
    allSections,
    section,
    setSection
}) {
    return (
        <aside className="w-[215px] flex-none border-r border-slate-200 bg-white px-3 py-5">
            <nav className="space-y-1">
                {allSections.map(item => {

                    const Icon = item.icon
                    const active = section === item.id

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSection(item.id)}
                            className={`
                                flex
                                w-full
                                items-center
                                gap-3
                                rounded-xl
                                px-3
                                py-2.5
                                text-left
                                text-sm
                                transition-colors
                                ${active
                                    ? "bg-blue-50 font-semibold text-blue-600"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }
                            `}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    )
                })}
            </nav>
        </aside>
    )
}