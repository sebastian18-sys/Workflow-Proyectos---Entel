export default function getPaginationItems(currentPage, totalPages, maxVisible = 5) {
	if (totalPages <= maxVisible) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const items = [];

	// Show first and last
	const innerCount = maxVisible - 2;
	let start = Math.max(2, currentPage - Math.floor(innerCount / 2));
	let end = Math.min(totalPages - 1, start + innerCount - 1);

	start = Math.max(2, Math.min(start, totalPages - 1 - (innerCount - 1)));
	end = Math.min(totalPages - 1, start + innerCount - 1);

	items.push(1);

	if (start > 2) items.push("ellipsis");

	for (let p = start; p <= end; p++) items.push(p);

	if (end < totalPages - 1) items.push("ellipsis");

	items.push(totalPages);

	return items;
}