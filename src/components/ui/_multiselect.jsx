import { useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Select items...",
	className,
}) {
	const [open, setOpen] = useState(false)

	const handleUnselect = (value) => {
		onChange(selected.filter((s) => s !== value))
	}

	const handleSelect = (value) => {
		if (selected.includes(value)) {
			onChange(selected.filter((s) => s !== value))
		} else {
			onChange([...selected, value])
		}
	}

  return (
    <Popover open={open} onOpenChange={setOpen}>
		<PopoverTrigger asChild>
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				className={cn("w-full justify-between h-auto min-h-10", className)}
			>
				<div className="flex flex-wrap gap-1">
					{selected.length > 0 ? (
					selected.map((value) => {
						const option = options.find((opt) => opt.value === value)
						return (
						<Badge key={value} variant="secondary" className="">
							{option?.label}
							<p
								className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
									handleUnselect(value)
									}
								}}
								onMouseDown={(e) => {
									e.preventDefault()
									e.stopPropagation()
								}}
								onClick={() => handleUnselect(value)}
							>
								<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
							</p>
						</Badge>
						)
					})
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
				</div>
			</Button>
		</PopoverTrigger>
		{/* MULTISELECTS */}
		<PopoverContent className="w-full p-0" align="start">
			<Command>
				<CommandInput placeholder="Search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup>
					{options.map((option) => {
						const isSelected = selected.includes(option.value)
						return (
						<CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
							<div
								className={cn(
									"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
									isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
								)}
								>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<span>{option.label}</span>
						</CommandItem>
						)
					})}
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
    </Popover>
  )
}