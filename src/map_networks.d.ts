import { Server } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";

type MapServerOmitted =
  | "cpuCores"
  | "ftpPortOpen"
  | "httpPortOpen"
  | "ip"
  | "isConnectedTo"
  | "maxRam"
  | "organizationName"
  | "ramUsed"
  | "smtpPortOpen"
  | "sqlPortOpen"
  | "sshPortOpen"
  | "purchasedByPlayer"
  | "backdoorInstalled"
  | "baseDifficulty"
  | "hackDifficulty"
  | "minDifficulty"
  | "openPortCount"
  | "serverGrowth";

export interface MapServer extends Omit<Server, MapServerOmitted> {
  timeToHack: number;
  connections: string[];
}
