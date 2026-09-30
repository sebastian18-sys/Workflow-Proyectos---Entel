export function filterNav(items, can) {
  return items
    .map((item) => {
        const children = item._children ? filterNav(item._children, can) : [];
        const allowedSelf = item.perm ? can(item.perm) : true;
        const allowed = allowedSelf || children.length > 0;
        if (!allowed) return null;
        return { ...item, _children: children };
    })
    .filter(Boolean);
}