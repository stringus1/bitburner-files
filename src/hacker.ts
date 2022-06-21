import { NS } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";

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
    if (ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host) > 0.1)
      await ns.grow(host);
    await ns.hack(host);
  }
}
