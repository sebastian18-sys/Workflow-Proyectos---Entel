export function clearWorkflowPersistentFilters(userKey = "") {
    if (typeof window === "undefined") return;

    const prefix = "workflowgcir:filters:";

    Object.keys(localStorage).forEach((key) => {
        const isWorkflowFilter = key.startsWith(prefix);

        if (!isWorkflowFilter) return;

        if (userKey) {
            const belongsToUser = key.includes(`:${userKey}:`);
            if (!belongsToUser) return;
        }

        localStorage.removeItem(key);
    });
}