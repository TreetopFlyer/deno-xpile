import Server from "./AmberServer.tsx";

const ConfigText = await Deno.readTextFile("./deno.jsonc");
const ConfigJSON = JSON.parse(ConfigText);
const ImportText = await Deno.readTextFile(ConfigJSON.importMap);

Server({Start:Deno.args[0], Import:ImportText});