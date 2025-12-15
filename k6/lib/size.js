export function bodySize(res) {
    const h = res.headers && (res.headers["Content-Length"] || res.headers["content-length"]);
    if (h) {
        const n = parseInt(h, 10);
        if (Number.isFinite(n)) return n;
    }
    const b = res.body;
    if (b === null || b === undefined) return 0;
    if (typeof b === "string") return b.length;
    return 0;
}