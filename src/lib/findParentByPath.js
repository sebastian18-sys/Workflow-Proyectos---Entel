// Encuentra el padre cuyo hijo coincide con la ruta actual
export default function findParentByPath(navigation, pathname) {
	for (const parent of navigation) {
		if (parent._children?.some(c => pathname.startsWith(c.path))) return parent;
		if (parent.path && pathname.startsWith(parent.path)) return parent;
	}
	return null;
}