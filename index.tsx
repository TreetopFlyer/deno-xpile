import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "./app/App.tsx";
import { serve } from "std/http/server.ts";
import importMap from "./imports.json" assert { type: "json" };
import { PathParse, State } from "./app/Iso.tsx";

const location = Deno.env.get("DENO_DIR") + "/gen/file/" + Deno.cwd().replace(":", "").replaceAll("\\", "/") + "/";

import * as FS from "std/fs/mod.ts";
import * as Twind from "esm/twind";
import * as TwindServer from "esm/twind/shim/server";
const sheet = TwindServer.virtualSheet();
const parse = Twind.create({ sheet: sheet, preflight: true, theme: {}, plugins: {}, mode: "silent" }).tw;
const leave = [ "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "valueOf", "toLocaleString" ];

for await (const filePath of FS.walk(location, {exts:["tsx.js"]}))
{
    const fileText = await Deno.readTextFile(filePath.path);
    const m = fileText.match(/[^<>\[\]\(\)|&"'`\.\s]*[^<>\[\]\(\)|&"'`\.\s:]/g);
    if (m)
    {
        for (const c of m)
        {
            if (leave.indexOf(c) === -1)
            {
                try { parse(c); }
                catch (e) { console.log(`Error: Failed to handle the pattern '${c}'`); }
            }
        }
    }
}

const tailwind = TwindServer.getStyleTagProperties(sheet).textContent;

serve(async (inRequest:Request) =>
{
    const url = new URL(inRequest.url);
    const path = url.pathname.substring(1).toLowerCase();
    if(path == "favicon.ico"){return new Response("404", {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});}
    if(path.startsWith("app/"))
    {
        const mappedPath = location+path+".js";
        try
        {
            const text = await Deno.readTextFile(mappedPath);
            return new Response(text, {status:200, headers:{"content-type": "application/javascript; charset=utf-8"}});
        }
        catch(e)
        {
            return new Response(mappedPath, {status:404, headers:{"content-type": "application/javascript; charset=utf-8"}});
        }
    }
    else
    {

        const isoModel:State = {
            Meta:{},
            Data:{},
            Path:PathParse(url),
            Client:false,
            Queue:[]
        }

        let bake = ReactDOMServer.renderToString(<App iso={isoModel}/>);
        let count = 0;
        while(isoModel.Queue.length)
        {
            count ++;
            if(count > 5)
            {
                break;
            }
            await Promise.all(isoModel.Queue);
            isoModel.Queue = [];
            bake = ReactDOMServer.renderToString(<App iso={isoModel}/>);
        }

        const page = await ReactDOMServer.renderToReadableStream(<html>
            <head>
                <title>{isoModel.Meta.Title??""}</title>
                <link rel="canonical" href={isoModel.Path.Parts.join("/")}></link>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="description" content={isoModel.Meta.Description??""}/>
                <style dangerouslySetInnerHTML={{__html:tailwind}}/>
                <script type="importmap" dangerouslySetInnerHTML={{__html:JSON.stringify(importMap)}}/>
            </head>
            <body>
                <div id="app" dangerouslySetInnerHTML={{__html:bake}}></div>
                <script type="module" dangerouslySetInnerHTML={{__html:`
import {createElement as h} from "react";
import {hydrateRoot} from "react-dom/client";
import App from "./app/App.tsx";

const iso = ${JSON.stringify(isoModel)};
iso.Client = true;

hydrateRoot(document.querySelector("#app"), h(App, {iso}));
`}}/>
            </body>
        </html>);

        return new Response(page, {status:200, headers:{"content-type": "text/html; charset=utf-8"}});
    }
}
, {port:3333});