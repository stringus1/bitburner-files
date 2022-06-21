import { NS } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";
import { resolveTripleslashReference } from "../node_modules/typescript/lib/typescript";
import { MapServer } from "./map_networks";

const NETMAP_FILE = "network_map.json.txt";

type MapServerKey = keyof MapServer;
const KEYS: MapServerKey[] = [
  "hostname",
  "hasAdminRights",
  "moneyAvailable",
  "moneyMax",
  "requiredHackingSkill",
  "timeToHack",
  "numOpenPortsRequired",
];

/** @param {NS} ns */
export async function main(ns: NS) {
  const argData = ns.flags([
    ["filters", ""],
    ["sorts", ""],
  ]);

  let filters;
  if (argData.filters !== "") {
    const filtersInput: string[][] = argData.filters
      .split(",")
      .map((filter) => filter.split("_"))
      .map(validateFilter);
    filters = filtersInput.map(validateFilter);
  }

  let sorts;
  if (argData.sorts !== "") {
    const sortsInput: string[][] = argData.sorts
      .split(",")
      .map((sort) => sort.split("_"));

    sorts = sortsInput.map(validateSort);
  }

  const networkMap = await netmap(ns, { filters, sorts });

  const servers = Object.values(networkMap);
  const colWidthsByName = getFieldWidths(servers);
  const colWidths = KEYS.map((key) => colWidthsByName[key]);

  const header = makeTableRow(colWidths, Object.values(KEYS));
  const rowLine = makeLine(colWidths, "center");
  ns.tprint(makeLine(colWidths, "top"));
  ns.tprint(header);
  ns.tprint(rowLine);

  let start = true;
  for (const host in networkMap) {
    if (!start) ns.tprint(rowLine);
    start = false;

    const server = networkMap[host];
    ns.tprint(
      makeTableRow(
        colWidths,
        KEYS.map((key) => server[key])
      )
    );
  }
  ns.tprint(makeLine(colWidths, "bottom"));
}

interface NetmapOptions {
  filters?: Filter[];
  sorts?: SortSpec[];
}
export default async function netmap(ns, options: NetmapOptions = {}) {
  let map: { [key: string]: MapServer } = JSON.parse(
    await ns.read(NETMAP_FILE)
  );
  let servers = Object.values(map);

  const { filters, sorts } = options;
  if (filters) {
    servers = filter(filters, servers);
  }
  if (sorts) {
    servers = sort(sorts, servers);
  }
  return Object.fromEntries(servers.map((server) => [server.hostname, server]));
}

// Filtering and Sorting
const TYPE_CASTS = {
  number: parseFloat,
  string: (a: string) => a,
  boolean: (a: string) => (a === "false" ? false : Boolean(a).valueOf()),
};

type FilterMode = "=" | ">" | ">=" | "<" | "<=" | "~";
type Filter = [filterKey: MapServerKey, filterMode: FilterMode, value: any];
const FILTERS: { [key in FilterMode]: (a: any, b: any) => boolean } = {
  "=": (a, b) => a == b,
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a < b,
  "~": (a, b) => a.indexOf(b) || b.indexOf(a),
};

function filter(filters: Filter[], servers: MapServer[]) {
  let filteredServers = servers;
  for (let filter of filters) {
    if (filteredServers.length) {
      const [filterKey, filterMode, value] = filter;
      const castValue = TYPE_CASTS[typeof filteredServers[0][filterKey]](value);

      filteredServers = filteredServers.filter((server) =>
        FILTERS[filterMode](server[filterKey], castValue)
      );
    }
  }
  return filteredServers;
}

function validateFilter(filter: string[]): Filter {
  if (filter.length != 3) {
    throw new Error(
      `Filter '${filter}' should have three parts separated by '_'`
    );
  }

  const [filterKey, filterMode, value] = filter;
  if (!KEYS.includes(filterKey as MapServerKey)) {
    throw new Error(`Filter '${filter}' contains unknown key '${filterKey}'`);
  }

  if (!(filterMode in FILTERS)) {
    throw new Error(
      `Filter '${filter}' contains unknown comparison '${filterMode}'`
    );
  }

  return filter as Filter;
}

type SortMode = "+" | "-";
type SortSpec = [sortKey: MapServerKey, sortMode: SortMode];
function sort(sortSpecs: SortSpec[], servers: MapServer[]) {
  const sorted = [...servers];

  sorted.sort((a, b) => {
    for (let sortSpec of sortSpecs) {
      const [sortKey, sortMode] = sortSpec;

      const sign = sortMode === "-" ? -1 : 1;

      if (a[sortKey] > b[sortKey]) {
        return sign;
      } else if (a[sortKey] < b[sortKey]) {
        return -sign;
      }
    }
    return 0;
  });

  return sorted;
}

function validateSort(sort: string[]): SortSpec {
  if (sort.length != 2) {
    throw new Error(`Sort '${sort}' should have two parts separated by '_'`);
  }

  const [sortKey, sortMode] = sort;
  if (!KEYS.includes(sortKey as MapServerKey)) {
    throw new Error(`Sort '${sort}' contains unknown key '${sortKey}'`);
  }

  if (!["+", "-"].includes(sortMode)) {
    throw new Error(`Sort '${sort}' contains unknown ordering '${sortMode}'`);
  }

  return sort as SortSpec;
}

// Table Drawing

const BOX_DRAWING = {
  HORIZONTAL: "─",
  VERTICAL: "│",
  TOP_LEFT: "┌",
  TOP_RIGHT: "┐",
  BOTTOM_LEFT: "└",
  BOTTOM_RIGHT: "┘",
  LEFT: "├",
  RIGHT: "┤",
  TOP: "┬",
  BOTTOM: "┴",
  CENTER: "┼",
};

function getFieldWidths(servers: MapServer[]) {
  const widths = {};

  for (let key of KEYS) {
    widths[key] = Math.max(
      key.length,
      ...servers.map((s) => s[key].toString().length)
    );
  }

  return widths;
}

function leftPad(str, width, padWith: string = " ") {
  return pad("", width - str.length, padWith) + str;
}

function pad(str, width, padWith: string = " ") {
  let result = str;

  while (result.length < width) {
    result += padWith;
  }
  return result;
}

type LinePosition = "top" | "center" | "bottom";
function makeLine(widths: number[], position: LinePosition = "center") {
  const chars = {
    top: {
      LEFT: BOX_DRAWING.TOP_LEFT,
      CENTER: BOX_DRAWING.TOP,
      RIGHT: BOX_DRAWING.TOP_RIGHT,
    },
    center: {
      LEFT: BOX_DRAWING.LEFT,
      CENTER: BOX_DRAWING.CENTER,
      RIGHT: BOX_DRAWING.RIGHT,
    },
    bottom: {
      LEFT: BOX_DRAWING.BOTTOM_LEFT,
      CENTER: BOX_DRAWING.BOTTOM,
      RIGHT: BOX_DRAWING.BOTTOM_RIGHT,
    },
  }[position];

  let result =
    chars.LEFT +
    widths
      .map((n) => pad("", n + 2, BOX_DRAWING.HORIZONTAL))
      .join(chars.CENTER) +
    chars.RIGHT;
  return result;
}

function makeTableRow(widths: number[], values: any[]) {
  return (
    BOX_DRAWING.VERTICAL +
    " " +
    values
      .map((val, i) => pad(val.toString(), widths[i]))
      .join(" " + BOX_DRAWING.VERTICAL + " ") +
    " " +
    BOX_DRAWING.VERTICAL
  );
}
