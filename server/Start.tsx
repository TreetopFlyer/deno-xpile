import Server from "amber-server";
import App from "../client/Start.tsx";
import Map from "../imports.json" assert {type:"json"};

Server({App, Map});