/** @param {NS} ns */
export async function main(ns) {
    const host = ns.getHostname();
    for (;;) {
        while (ns.hackAnalyzeChance(host) < 0.40) {
            await ns.weaken(host);
        }
        while (ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host) < 0.10) {
            await ns.grow(host);
        }
        await ns.hack(host);
    }
}
