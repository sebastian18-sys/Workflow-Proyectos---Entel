export default function SimulationIllustration() {
	return (
		<svg viewBox="0 0 400 140" className="w-full max-w-3xl">
			<defs>
				<linearGradient id="g" x1="0" x2="1">
				<stop offset="0%" stopColor="#dbeafe" />
				<stop offset="100%" stopColor="#eff6ff" />
				</linearGradient>
			</defs>
			<rect x="0" y="0" width="400" height="140" rx="16" fill="url(#g)" />
			<g transform="translate(22,24)">
				<rect width="190" height="90" rx="10" fill="#ffffff" />
				<rect x="12" y="14" width="56" height="10" rx="5" fill="#e2e8f0" />
				<rect x="12" y="34" width="160" height="10" rx="5" fill="#bfdbfe" />
				<rect x="12" y="54" width="120" height="10" rx="5" fill="#c7d2fe" />
				<rect x="12" y="74" width="90" height="10" rx="5" fill="#ddd6fe" />
			</g>
			<g transform="translate(230,24)">
				<rect width="150" height="90" rx="10" fill="#ffffff" />
				<path d="M14 78 L30 58 L52 66 L76 42 L100 54 L128 20" stroke="#60a5fa" strokeWidth="3" fill="none" />
				<circle cx="128" cy="20" r="4" fill="#60a5fa" />
			</g>
			{/* <text x="20" y="130" fontSize="12" fill="#64748b">
				Sube tu plantilla y genera escenarios OPEX con simulaciones.
			</text> */}
		</svg>
	);
}