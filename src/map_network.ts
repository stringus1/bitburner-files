import { NS } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { MapServer } from "./map_networks";

const HOME = "home";
const NETWORK_MAP = "network_map.json";
// import { HOME, NETWORK_MAP } from 'config.js';

/** @param {NS} ns **/
export async function main(ns: NS) {
  const argData = ns.flags([["daemon", false]]);

  const scanHost = (host, currentData: { [key: string]: MapServer } = {}) => {
    const myConnections = ns.scan(host);
    const moneyAvailable = ns.getServerMoneyAvailable(host);
    const timeToHack = ns.getHackTime(host);

    let mapServer: MapServer = {
      hostname: host,
      hasAdminRights: ns.hasRootAccess(host),
      moneyAvailable,
      moneyMax: ns.getServerMaxMoney(host),
      requiredHackingSkill: ns.getServerRequiredHackingLevel(host),
      timeToHack,
      numOpenPortsRequired: ns.getServerNumPortsRequired(host),
      connections: myConnections,
    };

    let newData: { [key: string]: MapServer } = {
      ...currentData,
      [host]: mapServer,
    };

    myConnections
      .filter((node) => !newData[node]) // prevent infinite looping...
      .forEach((node) => {
        newData = scanHost(node, newData);
      });

    return newData;
  };

  const run = async () => {
    const data = scanHost(HOME);
    await ns.write(NETWORK_MAP, JSON.stringify(data, null, 2), "w");
  };

  if (argData.daemon) {
    while (true) {
      await run();
      await ns.sleep(5000);
    }
  } else {
    await run();
  }
}
