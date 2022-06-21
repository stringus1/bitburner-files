/** @param {NS} ns */
export async function main(ns) {
    const host = ns.getHostname();
    if (host === "home") {
        return;
    }
    for (;;) {
        while (ns.hackAnalyzeChance(host) < 0.4) {
            await ns.weaken(host);
        }
        for (let i = 0; i < 3; i++) {
            if (ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host) > 0.1)
                break;
            await ns.grow(host);
        }
        await ns.hack(host);
    }
}
