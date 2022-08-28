import React from "react";
import ReactDOMServer from "react-dom/server";
import App, { PreloadTable } from "./app/App.tsx";
import { serve } from "std/http/server.ts";
import importMap from "./imports.json" assert { type: "json" };

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
const tailwind = TwindServer.getStyleTagProperties(sheet);

serve(async (inRequest:Request) =>
{
    const url = new URL(inRequest.url);
    const path = url.pathname.substring(1).toLowerCase();
    console.log("--", inRequest.url, "--");
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
        const raw = await fetch(`https://catfact.ninja/fact`);
        const data = await raw.json();

        const preload:PreloadTable = {
            meta:
            {
                title:"XPiles Homepage",
                description:"prerendered!",
                canonical:"/"
            },
            data:
            {
            },
            path:"",
            fetch:(inURL)=>{},
            queue:[]
        };
        preload.fetch = (inURL)=>
        {
            const check:string|undefined = preload.data[inURL];
            if(check)
            {
                return check;
            }
            else
            {
                preload.queue.push(
                    fetch(inURL)
                    .then(response=>response.json())
                    .then(json=>preload.data[inURL] = json)
                );
            }
        }

        let bake = ReactDOMServer.renderToString(<App route={inRequest.url} preload={preload}/>);
        let count = 0;
        while(preload.queue.length)
        {
            count ++;
            if(count > 5)
            {
                console.log("limited!");
                break;
            }
            await Promise.all(preload.queue);
            preload.queue = [];
            bake = ReactDOMServer.renderToString(<App route={inRequest.url} preload={preload}/>);
        }

        console.log("done preloading");

        const page = await ReactDOMServer.renderToReadableStream(<html>
            <head>
                <title>{preload.meta.title}</title>
                <style dangerouslySetInnerHTML={{__html:tailwind.textContent}}/>
                <script type="importmap" dangerouslySetInnerHTML={{__html:JSON.stringify(importMap)}}/>
            </head>
            <body>
                <div id="app"><App route={inRequest.url} preload={preload}/></div>
                <script type="module" dangerouslySetInnerHTML={{__html:`

                    import {createElement as h} from "react";
                    import {hydrateRoot} from "react-dom/client";
                    import App from "./app/App.tsx";

                    const root = document.querySelector("#app");
                    const comp = h(App, {
                        route:"${inRequest.url}",
                        navigation:window.navigation
                    });

                    hydrateRoot(root, comp);
                `}}/>
            </body>
        </html>);
        await page.allReady;

        return new Response(page, {status:200, headers:{"content-type": "text/html; charset=utf-8"}});
    }
}
, {port:3333});