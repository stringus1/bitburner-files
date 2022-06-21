import Queue from "queue.js";
/** @param {NS} ns */
// export async function main(ns) {
// }
function flicker(q, v) {
    q.remove(v);
    q.add(v);
}
export function shortestPath(ns, graph, to, fr) {
    fr = fr || "home";
    const vertices = Object.keys(graph);
    const dist = {};
    const prev = {};
    const q = new Queue((a, b) => {
        return dist[a] < dist[b];
    });
    dist[fr] = 0;
    for (let v of vertices) {
        if (v != fr) {
            dist[v] = Infinity;
        }
        q.add(v);
    }
    while (!q.isEmpty()) {
        let u = q.poll();
        let queue = [];
        for (let v of graph[u].connections) {
            let alt = dist[u] + 1;
            if (alt < dist[v]) {
                dist[v] = alt;
                prev[v] = u;
                flicker(q, v);
            }
        }
    }
    let path = [];
    let cur = to;
    while (cur && cur != fr) {
        path.push(cur);
        cur = prev[cur];
    }
    if (cur != fr) {
        return [];
    }
    path.push(fr);
    path.reverse();
    return path;
}
export async function main(ns) { }
