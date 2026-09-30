import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

export default function FileDropzone({ value, placeholder = "Click o arrastra para subir", onChange }) {
	const inputRef = useRef(null);
	const [hover, setHover] = useState(false);
	const onDrop = (e) => { 
		e.preventDefault(); 
		const f = e.dataTransfer.files?.[0]; 
		if (f) onChange(f); 
		setHover(false); 
	};
	return (
		<div
			onDragOver={(e)=>{e.preventDefault(); setHover(true);}}
			onDragLeave={(e)=>{e.preventDefault(); setHover(false);}}
			onDrop={onDrop}
			onClick={()=>inputRef.current?.click()}
			className={["flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition",
				hover ? "border-[#2b7fff] bg-[#2b7fff]/5" : "border-gray-300 hover:bg-gray-50",
			].join(" ")}
		>
			<UploadCloud className="h-7 w-7" />
			<div className="text-sm text-gray-700">{placeholder}</div>
			{value && <div className="text-xs text-gray-500">{value.name}</div>}
			<input ref={inputRef} type="file" className="hidden" onChange={(e)=> onChange(e.target.files?.[0] ?? null)} />
		</div>
	);
}