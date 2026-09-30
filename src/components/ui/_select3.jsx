import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export default function SelectFilter({
    label,
    icon: Icon,
    options = [],
    value,
    onChange,
    placeholder = "Seleccionar",
    disabled = false,
}) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                {Icon ? <Icon className="h-4 w-4 text-[#2b7fff]" /> : null}
                {label}
            </label>

            <Select
                value={value ?? ""}
                onValueChange={(next) => onChange?.(next)}
                disabled={disabled}
                // className="px-3 py-2 h-auto min-h-11"
            >
                <SelectTrigger className="h-auto min-h-11 w-full px-3 py-2 rounded-2xl text-slate-400 border-slate-200 bg-white text-left">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent className="rounded-2xl border-slate-200">
                {options.map((option) => {
                    const item =
                    typeof option === "string"
                        ? { value: option, label: option }
                        : option;

                    return (
                    <SelectItem
                        key={item.value}
                        value={item.value}
                        className="rounded-xl"
                    >
                        {item.label}
                    </SelectItem>
                    );
                })}
                </SelectContent>
            </Select>
        </div>
    );
}