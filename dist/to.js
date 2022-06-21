import netmap from "./netmap";
import { shortestPath } from "./djikstra";
/** @param {NS} ns */
export async function main(ns) {
    const host = ns.getHostname();
    const servers = await netmap(ns);
    const path = shortestPath(ns, servers, ns.args[0], host);
    ns.tprint(path.join(" -> "));
}
