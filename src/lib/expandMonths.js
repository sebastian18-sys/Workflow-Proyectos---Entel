function expandMonths(
    months,
    headers
) {
    const map = new Map((months ?? []).map(m => [m.header.trim(), Number(m.value) || 0]));
    const out = {};
    headers.forEach(h => { out[h] = map.get(h.trim()) ?? 0; });
    return out;
}