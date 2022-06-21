import { NS } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";

async function getServerList(ns: NS) {
  return (await ns.scan()).map((hostname) => ({
    hostname,
    // requiredHackingSkill: ns.getServerRequiredHackingLevel(hostname),
    // hasAdminRights: ns.hasRootAccess(hostname),
  }));
  // .filter(server => server.hasAdminRights)
}

const TRAVERSE_NAME = "traverse.js";
const TRAVERSE_URL =
  "https://raw.githubusercontent.com/stringus1/bitburner-files/master/dist/traverse.js";
const TRAVERSE_RAM = 5.5;

const PAYLOAD_NAME = "hacker.js";
const PAYLOAD_URL =
  "https://raw.githubusercontent.com/stringus1/bitburner-files/master/dist/hacker.js";
const PAYLOAD_RAM = 3.25;

/** @param {NS} ns */
export async function main(ns: NS): Promise<any> {
  const currentHost = ns.getHostname();
  const blacklist = ns.args.map((elem) => elem.toString()).concat(currentHost);
  const serverList = ns.scan().filter((host) => !blacklist.includes(host));
  ns.tprint(`${currentHost}:${ns.getScriptName()}: ${serverList}`);

  for (let hostname of serverList) {
    await ns.wget(TRAVERSE_URL, TRAVERSE_NAME, hostname);
    await ns.wget(PAYLOAD_URL, PAYLOAD_NAME, hostname);
    // await ns.scp(ns.getScriptName(), hostname)
    // await ns.scp(PAYLOAD_NAME, hostname)
    ns.exec(TRAVERSE_NAME, hostname, 1, ...blacklist);
  }
  for (let port of [
    ns.ftpcrack,
    ns.relaysmtp,
    ns.brutessh,
    ns.httpworm,
    ns.ftpcrack,
  ]) {
    try {
      port(currentHost);
    } catch {}
  }
  try {
    ns.nuke(currentHost);
  } catch {}

  const [total, used] = ns.getServerRam(currentHost);
  const free = total - used + TRAVERSE_RAM;
  const threads = Math.floor(free / PAYLOAD_RAM);

  ns.spawn(PAYLOAD_NAME, threads, ...blacklist);
  //ns.exec(SCRIPT_NAME, currentHost, 1, ...blacklist)
}
