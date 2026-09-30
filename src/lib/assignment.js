export function resolveResponsibleUserIds(responsibles = [], groups = []) {
    
    const ids = new Set()

    for (const responsible of responsibles) {
        if (responsible.type === "USER" && responsible.id) {
            ids.add(String(responsible.id))
        }

        if (responsible.type === "GROUP" && responsible.id) {
            const group = groups.find(item =>
                String(
                    item.id ||
                    item.group_id ||
                    item._id
                ) ===
                String(responsible.id)
            )

            for (const memberId of group?.member_ids || []) {
                ids.add(String(memberId))
            }
        }
    }

    return [...ids]
}